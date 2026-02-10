import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from './analysis.service';
import { AnalysisResult } from './entities/analysis-result.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

// Mock Repository
const mockRepository = {
  save: jest.fn(),
  find: jest.fn(),
};

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: getRepositoryToken(AnalysisResult),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeXml', () => {
    it('should correctly parse a valid Forms XML', async () => {
      const xmlMock = `
        <Module Name="TEST_FORM">
          <Block Name="BLOCK_1" QueryDataSourceName="TABLE_1">
            <Item Name="ITEM_1"/>
          </Block>
          <Trigger Name="WHEN-new-FORM-INSTANCE">Trigger logic</Trigger>
          <ProgramUnit Name="PU_1">Procedure text</ProgramUnit>
        </Module>
      `;

      const result = await service.analyzeXml(xmlMock, 'test-project-id');

      expect(result.moduleName).toBe('TEST_FORM');
      // Fix: Access properties via parsedData JSONB field
      expect(result.parsedData.blocks).toHaveLength(1);
      expect(result.parsedData.blocks[0].name).toBe('BLOCK_1');
      expect(result.parsedData.triggers).toHaveLength(1);
      expect(result.parsedData.programUnits).toHaveLength(1);

      // Complexity check: 1 Trigger (5) + 1 PU (10) + LOC logic
      expect(Number(result.complexityScore)).toBeGreaterThan(0);
    });

    it('should calculate complexity score correctly', async () => {
      const xmlMock = `
        <Module Name="COMPLEX_FORM">
          <Trigger Name="TRG1">Line1\nLine2</Trigger>
          <Trigger Name="TRG2">Line1</Trigger> <!-- 2 triggers = 10 pts -->
          <ProgramUnit Name="PU1">Line1</ProgramUnit> <!-- 1 PU = 10 pts -->
          <!-- Total LOC = 4 lines = 0.4 pts -->
          <!-- Total expected = 20.4 -->
        </Module>
      `;

      const result = await service.analyzeXml(xmlMock, 'test-project-id');

      // (2 * 5) + (1 * 10) + (4 / 10) = 10 + 10 + 0.4 = 20.4
      expect(Number(result.complexityScore)).toBeCloseTo(20.4, 1);
    });

    it('should throw error for invalid XML', async () => {
      const invalidXml = '<Module Name="BROKEN">Unclosed Tag';
      await expect(service.analyzeXml(invalidXml, 'test-project-id')).rejects.toThrow();
    });

    it('should extract Record Groups correctly', async () => {
      const xmlWithRecordGroups = `
        <Module Name="RG_TEST">
          <RecordGroup Name="RG_1">
             <RecordGroupQuery>SELECT * FROM DUAL</RecordGroupQuery>
          </RecordGroup>
        </Module>
      `;
      const result = await service.analyzeXml(xmlWithRecordGroups, 'test-project-id');
      expect(result.parsedData.recordGroups).toHaveLength(1);
      expect(result.parsedData.recordGroups[0].name).toBe('RG_1');
      expect(result.parsedData.recordGroups[0].query).toBe('SELECT * FROM DUAL');
    });

    it('should identify complex PL/SQL candidates', async () => {
      const xmlComplex = `
        <Module Name="COMPLEX_TEST">
          <ProgramUnit Name="HEAVY_PROC">
            BEGIN
              FOR i IN 1..100 LOOP
                OPEN c_cursor;
              END LOOP;
            END;
          </ProgramUnit>
          <Trigger Name="SYNC_UI_TRG">
             BEGIN
               Show_Lov('LOV_1');
             END;
          </Trigger>
        </Module>
      `;
      const result = await service.analyzeXml(xmlComplex, 'test-project-id');
      expect(result.parsedData.complexityCandidates).toBeDefined();

      // Stored Procedure Candidate
      const spCandidate = result.parsedData.complexityCandidates.find(c => c.name === 'HEAVY_PROC');
      expect(spCandidate).toBeDefined();
      expect(spCandidate.type).toBe('ProgramUnit');
      expect(spCandidate.complexityType).toBe('Backend Candidate');

      // UI Async Candidate
      const uiCandidate = result.parsedData.complexityCandidates.find(c => c.name === 'SYNC_UI_TRG');
      expect(uiCandidate).toBeDefined();
      expect(uiCandidate.complexityType).toBe('UI Refactor Required');
      expect(uiCandidate.recommendation).toBeDefined();
      expect(uiCandidate.pseudocode).toContain('await modal.show');
    });

    it('should extract nested triggers from Items and Blocks (reproduction)', async () => {
      const xml = `
            <Module Name="REAL_WORLD_MODULE">
                <Block Name="BLOCK1">
                    <Item Name="BUTTON1">
                         <Trigger Name="WHEN-BUTTON-PRESSED" TriggerText="BEGIN SHOW_LOV('LOV_TEST'); END;"/>
                    </Item>
                </Block>
                <ProgramUnit Name="TOP_LEVEL_PROC" ProgramUnitText="PROCEDURE P IS BEGIN NULL; END;"/>
            </Module>`;

      const result = await service.analyzeXml(xml, 'test-project-id');

      // Should find the ProgramUnit
      expect(result.parsedData.programUnits.length).toBe(1);
      expect(result.parsedData.programUnits[0].name).toBe('TOP_LEVEL_PROC');

      // Should find the nested Trigger
      expect(result.parsedData.triggers.length).toBeGreaterThan(0);
      const trigger = result.parsedData.triggers.find(t => t.name === 'WHEN-BUTTON-PRESSED');
      expect(trigger).toBeDefined();

      // Should detect the UI complexity in the nested trigger
      const complexity = result.parsedData.complexityCandidates.find(c => c.name === 'WHEN-BUTTON-PRESSED');
      expect(complexity).toBeDefined();
      expect(complexity.complexityType).toBe('UI Refactor Required');
    });
  });
});

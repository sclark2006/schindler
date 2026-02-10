import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { IAnalysisAdapter } from '../interfaces/analysis.adapter.interface';

export class FormsXmlAdapter implements IAnalysisAdapter {
    private parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            isArray: (name) => ['Block', 'Trigger', 'ProgramUnit', 'Item', 'RecordGroup'].includes(name),
        });
    }

    validate(content: string): boolean {
        const validation = XMLValidator.validate(content);
        if (validation !== true) {
            return false;
        }
        // Basic check for Module tag to ensure it's Forms XML
        return content.includes('<Module');
    }

    async parse(xmlContent: string): Promise<any> {
        const parsed = this.parser.parse(xmlContent);

        if (!parsed.Module) {
            throw new Error('Invalid Forms XML: Missing <Module> tag');
        }

        const moduleData = parsed.Module;
        const formModule = moduleData.FormModule ? (Array.isArray(moduleData.FormModule) ? moduleData.FormModule[0] : moduleData.FormModule) : moduleData;
        const blocks = formModule.Block || moduleData.Block || [];

        // Extract Triggers with Context (Block Name)
        const triggers = this.extractTriggersWithContext(moduleData, 'Module');
        const programUnits = this.extractDeep(moduleData, 'ProgramUnit');
        const recordGroups = this.extractDeep(moduleData, 'RecordGroup');

        // Calculate stats
        const totalLoc = this.calculateLoc(triggers) + this.calculateLoc(programUnits);

        // Find complexity candidates
        const complexityCandidates = this.analyzePatternComplexity(triggers, programUnits);

        return {
            moduleName: moduleData.Name || 'Unknown',
            blocks: blocks.map((b: any) => ({
                name: b.Name,
                dataSource: this.decodeXmlEntities(b.QueryDataSourceName || 'None'),
                dataSourceType: b.QueryDataSourceType || 'Unknown',
                itemsCount: b.Item ? b.Item.length : 0
            })),
            triggers: triggers.map((t: any) => ({
                name: t.Name,
                parentBlock: t.ParentBlock || 'Module',
                loc: this.calculateLoc([t]),
                code: this.decodeXmlEntities(t.TriggerText || t['#text'] || '')
            })),
            programUnits: programUnits.map((p: any) => ({
                name: p.Name,
                loc: this.calculateLoc([p]),
                code: this.decodeXmlEntities(p.ProgramUnitText || p['#text'] || '')
            })),
            recordGroups: recordGroups.map((rg: any) => ({
                name: rg.Name,
                query: this.decodeXmlEntities(rg.RecordGroupQuery || '')
            })),
            complexityCandidates: complexityCandidates,
            stats: {
                totalBlocks: blocks.length,
                totalTriggers: triggers.length,
                totalProgramUnits: programUnits.length,
                totalLoc: totalLoc
            }
        };
    }

    private extractTriggersWithContext(obj: any, parentName: string): any[] {
        let elements: any[] = [];

        if (!obj || typeof obj !== 'object') {
            return elements;
        }

        // If current object is a Block, update parentName
        const currentContext = obj.Name && (obj.QueryDataSourceName !== undefined || obj.Item !== undefined) ? obj.Name : parentName;

        if (Array.isArray(obj)) {
            for (const item of obj) {
                elements = elements.concat(this.extractTriggersWithContext(item, currentContext));
            }
            return elements;
        }

        for (const key of Object.keys(obj)) {
            if (key === 'Trigger') {
                const found = obj[key];
                if (Array.isArray(found)) {
                    found.forEach(f => f.ParentBlock = currentContext);
                    elements = elements.concat(found);
                } else {
                    found.ParentBlock = currentContext;
                    elements.push(found);
                }
            } else if (typeof obj[key] === 'object') {
                // Check if we are entering a Block to update context
                const nextParent = key === 'Block' && obj[key].Name ? obj[key].Name : currentContext;
                elements = elements.concat(this.extractTriggersWithContext(obj[key], nextParent));
            }
        }

        return elements;
    }

    private extractDeep(obj: any, keyToFind: string): any[] {
        let elements: any[] = [];

        if (!obj || typeof obj !== 'object') {
            return elements;
        }

        if (Array.isArray(obj)) {
            for (const item of obj) {
                elements = elements.concat(this.extractDeep(item, keyToFind));
            }
            return elements;
        }

        for (const key of Object.keys(obj)) {
            if (key === keyToFind) {
                const found = obj[key];
                if (Array.isArray(found)) {
                    elements = elements.concat(found);
                } else {
                    elements.push(found);
                }
                elements = elements.concat(this.extractDeep(obj[key], keyToFind));
            } else {
                elements = elements.concat(this.extractDeep(obj[key], keyToFind));
            }
        }

        return elements;
    }

    private calculateLoc(items: any[]): number {
        return items.reduce((acc, item) => {
            const text = item['#text'] || item.TriggerText || item.ProgramUnitText || '';
            return acc + (text.split('\n').length || 0);
        }, 0);
    }

    private analyzePatternComplexity(triggers: any[], programUnits: any[]): any[] {
        const candidates = [];

        const checkKeywords = (text: string, type: string, name: string) => {
            const upperText = text.toUpperCase();

            // Stored Procedure Candidates (Heavy Logic)
            if (upperText.includes('CURSOR ') || upperText.includes(' LOOP') || upperText.includes('WHILE ')) {
                candidates.push({
                    name: name,
                    type: type,
                    complexityType: 'Backend Candidate',
                    reason: 'Contains Loops or Cursors',
                    recommendation: 'Move to NestJS Service',
                    pseudocode: `
@Injectable()
export class ${name}Service {
  async execute(): Promise<void> {
    // Migrated Logic from ${name}
    // TODO: Implement cursor logic using TypeORM or generic QueryBuilder
  }
}`
                });
                return;
            }

            // Sync UI Candidates
            if (upperText.includes('SHOW_LOV') || upperText.includes('SHOW_ALERT') || upperText.includes('SHOW_EDITOR')) {
                candidates.push({
                    name: name,
                    type: type,
                    complexityType: 'UI Refactor Required',
                    reason: 'Synchronous UI Call detected',
                    recommendation: 'Refactor to Async/Modal',
                    pseudocode: `
const handle${name} = async () => {
  const confirmed = await modal.show('${name}');
  if (confirmed) {
    // Proceed with logic
  }
}`
                });
            }
        };

        triggers.forEach(t => {
            const text = t.TriggerText || t['#text'] || '';
            checkKeywords(text, 'Trigger', t.Name);
        });

        programUnits.forEach(p => {
            const text = p.ProgramUnitText || p['#text'] || '';
            checkKeywords(text, 'ProgramUnit', p.Name);
        });

        return candidates;
    }
    private decodeXmlEntities(text: string): string {
        if (!text) return '';
        return text
            .replace(/&#10;/g, '\n')
            .replace(/&#x9;/g, '\t')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
    }
}

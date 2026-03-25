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
        // Basic check for Module tag to ensure it's Forms XML
        return content.includes('<Module');
    }

    // Oracle Forms Built-ins Inventory to avoid false positives for SP migration
    private readonly ORACLE_BUILTINS = new Set([
        'GO_BLOCK', 'GO_ITEM', 'GO_RECORD', 'NEXT_BLOCK', 'PREVIOUS_BLOCK',
        'ENTER_QUERY', 'EXECUTE_QUERY', 'EXIT_FORM', 'CALL_FORM', 'OPEN_FORM',
        'SHOW_ALERT', 'SHOW_LOV', 'SHOW_EDITOR', 'SET_ITEM_PROPERTY', 'GET_ITEM_PROPERTY',
        'SET_BLOCK_PROPERTY', 'GET_BLOCK_PROPERTY', 'SET_WINDOW_PROPERTY', 'HIDE_WINDOW',
        'SHOW_WINDOW', 'MESSAGE', 'SYNCHRONIZE', 'COMMIT_FORM', 'CLEAR_FORM',
        'validate', 'NAME_IN', 'COPY', 'DEFAULT_VALUE', 'ERASE', 'FIND_ALERT', 'FIND_BLOCK',
        'FIND_CANVAS', 'FIND_EDITOR', 'FIND_FORM', 'FIND_ITEM', 'FIND_LOV', 'FIND_MENU_ITEM',
        'FIND_RELATION', 'FIND_TAB_PAGE', 'FIND_TIMER', 'FIND_VIEW', 'FIND_WINDOW',
        'FIRST_RECORD', 'LAST_RECORD', 'NEXT_RECORD', 'PREVIOUS_RECORD', 'NEXT_SET',
        'SCROLL_DOWN', 'SCROLL_UP', 'SELECT_ALL', 'SET_ALERT_BUTTON_PROPERTY'
    ]);

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
            moduleName: formModule.Name || moduleData.Name || 'Unknown',
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
            let text = item['#text'] || item.TriggerText || item.ProgramUnitText || '';
            if (!text) return acc;

            // 1. Decode XML Entities first
            text = this.decodeXmlEntities(text);

            // 2. Remove Comments
            // Remove single line comments (-- ...)
            text = text.replace(/--.*$/gm, '');
            // Remove multi-line comments (/* ... */)
            text = text.replace(/\/\*[\s\S]*?\*\//g, '');

            // 3. Count non-empty lines
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            return acc + lines.length;
        }, 0);
    }

    private analyzePatternComplexity(triggers: any[], programUnits: any[]): any[] {
        const candidates = [];

        const checkKeywords = (text: string, type: string, name: string) => {
            const upperText = text.toUpperCase();

            // Stored Procedure Candidates (Heavy Logic + DB Access)
            const hasDbAccess = upperText.includes('SELECT ') || upperText.includes('INSERT ') || upperText.includes('UPDATE ') || upperText.includes('DELETE ');
            const loc = this.calculateLoc([{ '#text': text }]);

            if (type === 'ProgramUnit' && !this.ORACLE_BUILTINS.has(name.toUpperCase())) {
                if (hasDbAccess && loc > 50) {
                    candidates.push({
                        name: name,
                        type: type,
                        complexityType: 'Backend Candidate (Stored Procedure)',
                        reason: `High Logic (${loc} LOC) + Direct DB Access detected`,
                        recommendation: 'Move logic to Stored Procedure or NestJS Service',
                        pseudocode: `
-- New Stored Procedure
CREATE OR REPLACE PROCEDURE ${name}_SP (...) IS
BEGIN
    -- Logic extracted from Form
    ${text.substring(0, 100)}...
END;`
                    });
                    return;
                }
            }

            // Enhanced Trigger Heuristics
            if (type === 'Trigger') {
                // Navigation Patterns
                if (upperText.includes('GO_BLOCK') || upperText.includes('GO_ITEM') || upperText.includes('CALL_FORM') || upperText.includes('OPEN_FORM')) {
                    candidates.push({
                        name: name,
                        type: type,
                        complexityType: 'Navigation Logic',
                        reason: 'Contains legacy navigation calls',
                        recommendation: 'Refactor to React Router (useNavigate) or Tab Context',
                        pseudocode: '// const navigate = useNavigate();\n// navigate("/target-route");'
                    });
                }

                // Validation Patterns
                if (upperText.includes('RAISE FORM_TRIGGER_FAILURE')) {
                    candidates.push({
                        name: name,
                        type: type,
                        complexityType: 'Validation Logic',
                        reason: 'Stops form execution (Validation)',
                        recommendation: 'Refactor to Formik/React Hook Form validation schema (Yup/Zod)',
                        pseudocode: '// validationSchema: Yup.object({ field: Yup.string().required() })'
                    });
                }

                // UI Interaction Patterns
                if (upperText.includes('SET_ITEM_PROPERTY') || upperText.includes('SET_BLOCK_PROPERTY') || upperText.includes('SHOW_VIEW')) {
                    candidates.push({
                        name: name,
                        type: type,
                        complexityType: 'UI State Logic',
                        reason: 'Directly manipulates UI properties',
                        recommendation: 'Refactor to React State (useState) or Context',
                        pseudocode: '// setIsVisible(true);\n// setDisabled(false);'
                    });
                }
            }

            // Complex Logic in Triggers -> React/Backend Candidate
            if ((upperText.includes('CURSOR ') || upperText.includes(' LOOP') || upperText.includes('WHILE ')) && type === 'Trigger') {
                candidates.push({
                    name: name,
                    type: type,
                    complexityType: 'Backend Candidate',
                    reason: 'Contains Loops/Cursors in Trigger',
                    recommendation: 'Move to NestJS Service called by React',
                    pseudocode: `
@Injectable()
export class ${name}Service {
  async execute(): Promise<void> {
    // Migrated Logic from ${name}
    // TODO: Implement cursor logic using TypeORM or generic QueryBuilder
  }
}
// Frontend: await backend.${name}Service.execute();
`
                });
                return;
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

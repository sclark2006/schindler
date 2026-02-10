export interface Block {
    name: string;
    dataSource: string;
    dataSourceType: string;
    itemsCount: number;
}

export interface Trigger {
    name: string;
    loc: number;
    code: string;
    parentBlock?: string;
}

export interface ProgramUnit {
    name: string;
    loc: number;
    code: string;
}

export interface RecordGroup {
    name: string;
    query: string;
}

export interface ComplexityCandidate {
    name: string;
    type: string;
    complexityType: string;
    reason: string;
    recommendation?: string;
    pseudocode?: string;
    code?: string;
}

export interface Stats {
    totalBlocks: number;
    totalTriggers: number;
    totalProgramUnits: number;
    totalLoc: number;
}

export interface ParsedData {
    blocks: Block[];
    triggers: Trigger[];
    programUnits: ProgramUnit[];
    recordGroups: RecordGroup[];
    complexityCandidates: ComplexityCandidate[];
    stats: Stats;
}

export interface AnalysisResult {
    id: string;
    moduleName: string;
    complexityScore: number;
    complexityLevel: string;
    createdAt: string;
    parsedData: ParsedData;
}

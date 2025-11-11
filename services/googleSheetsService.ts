// Fix for 'gapi' and 'google' not being defined because they are loaded from a script.
declare const gapi: any;
declare const google: any;

import { AppData, CashFlowSession, Employee, EmployeeType, SalariedEmployee, HourlyEmployee, SupplierExpense, StructuralCost, StructuralCostType } from "../types";

// --- CONFIGURATION ---
const CLIENT_ID = process.env.CLIENT_ID;
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

// FIX: Change type to 'any' to avoid namespace error for 'google' which is loaded via script.
let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// --- SHEET NAMES AND HEADERS ---
const SHEETS = {
    CASH_FLOW: 'Caja',
    EMPLOYEES: 'Personal',
    SUPPLIERS: 'Proveedores',
    STRUCTURAL_COSTS: 'CostesEstructura'
};

const HEADERS = {
    [SHEETS.CASH_FLOW]: ['id', 'date', 'description', 'income', 'expenses', 'workedHours'],
    [SHEETS.EMPLOYEES]: ['id', 'employeeType', 'name', 'baseSalary/hourlyRate', 'otherCosts'],
    [SHEETS.SUPPLIERS]: ['id', 'date', 'supplierName', 'description', 'amount', 'imageUrl'],
    [SHEETS.STRUCTURAL_COSTS]: ['id', 'date', 'name', 'amount', 'type', 'category']
};

// --- GAPI/GIS INITIALIZATION ---

/**
 * Initializes the Google API client and Google Identity Services.
 */
export const initClient = (authStateCallback: (isSignedIn: boolean) => void): Promise<void> => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => gapiLoaded(authStateCallback).then(resolve).catch(reject);
        script.onerror = () => reject(new Error('Failed to load GSI script.'));
        document.body.appendChild(script);
    });
};

async function gapiLoaded(authStateCallback: (isSignedIn: boolean) => void) {
    await new Promise<void>((resolve) => gapi.load('client', resolve));
    // The API key is not needed for OAuth2 flows where we access private user data.
    // The client is initialized just to load the discovery document.
    await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    gapiInited = true;
    gisLoaded(authStateCallback);
}

function gisLoaded(authStateCallback: (isSignedIn: boolean) => void) {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID!,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse.error) {
                console.error("Token error:", tokenResponse.error);
                authStateCallback(false);
                return;
            }
            // Set the token for gapi to use for all subsequent API calls
            gapi.client.setToken(tokenResponse);
            authStateCallback(true);
        },
    });
    gisInited = true;
}


// --- AUTHENTICATION ---

export const signIn = () => {
    if (!gapiInited || !gisInited) {
        alert("Google API client has not initialized yet.");
        return;
    }
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({ prompt: 'consent' });
};

export const signOut = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
        });
    }
};

// --- SPREADSHEET CREATION ---
export const createSpreadsheet = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.sheets.spreadsheets.create({
            properties: { title: `Finance Tracker - ${new Date().toLocaleDateString()}` }
        });
        const spreadsheetId = response.result.spreadsheetId;
        if (!spreadsheetId) throw new Error("Spreadsheet creation failed.");

        const requests = Object.entries(HEADERS).map(([sheetName, headers]) => ({
            addSheet: {
                properties: { title: sheetName }
            }
        }));
        
        await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId, resource: { requests }});

        // Add headers to each new sheet
        const data = Object.entries(HEADERS).map(([sheetName, headers]) => ({
            range: `${sheetName}!A1`,
            values: [headers]
        }));
        
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: data
            }
        });

        // Delete the default 'Sheet1'
        const sheetResponse = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
        const defaultSheet = sheetResponse.result.sheets?.find(s => s.properties?.sheetId === 0);
        if (defaultSheet) {
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests: [{ deleteSheet: { sheetId: 0 } }] }
            });
        }
        
        return spreadsheetId;
    } catch (err) {
        console.error("Error creating spreadsheet:", err);
        alert(`Error: ${err.result.error.message}`);
        return null;
    }
}

// --- DATA MAPPING HELPERS ---

// These helpers convert between the app's object model and the spreadsheet's row array format.
// JSON.stringify/parse is used for complex fields like expenses array.

const mapRowToSession = (row: any[], index: number): CashFlowSession => ({
    id: row[0],
    rowIndex: index + 2, // +2 because sheets are 1-based and we skip header
    date: row[1],
    description: row[2],
    income: row[3] ? JSON.parse(row[3]) : null,
    expenses: row[4] ? JSON.parse(row[4]) : [],
    workedHours: row[5] ? JSON.parse(row[5]) : []
});
const mapSessionToRow = (session: Partial<CashFlowSession>): any[] => ([
    session.id || crypto.randomUUID(),
    session.date,
    session.description,
    session.income ? JSON.stringify(session.income) : null,
    session.expenses ? JSON.stringify(session.expenses) : '[]',
    session.workedHours ? JSON.stringify(session.workedHours) : '[]'
]);

const mapRowToEmployee = (row: any[], index: number): Employee => {
    const common = {
        id: row[0],
        rowIndex: index + 2,
        employeeType: row[1] as EmployeeType,
        name: row[2],
    };
    if (common.employeeType === EmployeeType.Salaried) {
        return { ...common, baseSalary: parseFloat(row[3]) || 0, otherCosts: parseFloat(row[4]) || 0 } as SalariedEmployee;
    }
    return { ...common, hourlyRate: parseFloat(row[3]) || 0 } as HourlyEmployee;
};
const mapEmployeeToRow = (employee: Omit<Employee, 'id' | 'rowIndex'>): any[] => {
    const isSalaried = employee.employeeType === EmployeeType.Salaried;
    return [
        crypto.randomUUID(),
        employee.employeeType,
        employee.name,
        isSalaried ? (employee as Omit<SalariedEmployee, 'id'|'rowIndex'>).baseSalary : (employee as Omit<HourlyEmployee, 'id'|'rowIndex'>).hourlyRate,
        isSalaried ? (employee as Omit<SalariedEmployee, 'id'|'rowIndex'>).otherCosts : null,
    ];
};

const mapRowToSupplierExpense = (row: any[], index: number): SupplierExpense => ({
    id: row[0],
    rowIndex: index + 2,
    date: row[1],
    supplierName: row[2],
    description: row[3],
    amount: parseFloat(row[4]) || 0,
    imageUrl: row[5]
});
const mapSupplierExpenseToRow = (expense: Omit<SupplierExpense, 'id' | 'rowIndex'>): any[] => ([
    crypto.randomUUID(),
    expense.date,
    expense.supplierName,
    expense.description,
    expense.amount,
    expense.imageUrl
]);

const mapRowToStructuralCost = (row: any[], index: number): StructuralCost => ({
    id: row[0],
    rowIndex: index + 2,
    date: row[1],
    name: row[2],
    amount: parseFloat(row[3]) || 0,
    type: row[4] as StructuralCostType,
    category: row[5]
});
const mapStructuralCostToRow = (cost: Omit<StructuralCost, 'id' | 'rowIndex'>): any[] => ([
    crypto.randomUUID(),
    cost.date,
    cost.name,
    cost.amount,
    cost.type,
    cost.category
]);


// --- DATA FETCHING ---
const getSheetData = async (spreadsheetId: string, sheetName: string): Promise<any[][]> => {
    const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A2:Z` });
    return res.result.values || [];
}

export const loadAllData = async (spreadsheetId: string): Promise<AppData> => {
    const [sessions, employees, suppliers, structural] = await Promise.all([
        getSheetData(spreadsheetId, SHEETS.CASH_FLOW),
        getSheetData(spreadsheetId, SHEETS.EMPLOYEES),
        getSheetData(spreadsheetId, SHEETS.SUPPLIERS),
        getSheetData(spreadsheetId, SHEETS.STRUCTURAL_COSTS),
    ]);
    return {
        cashFlowSessions: sessions.map(mapRowToSession),
        employees: employees.map(mapRowToEmployee),
        supplierExpenses: suppliers.map(mapRowToSupplierExpense),
        structuralCosts: structural.map(mapRowToStructuralCost),
    };
};

export const loadSheetData = async (spreadsheetId: string, sheet: keyof AppData): Promise<Partial<AppData>> => {
     switch (sheet) {
        case 'cashFlowSessions':
            return { cashFlowSessions: (await getSheetData(spreadsheetId, SHEETS.CASH_FLOW)).map(mapRowToSession) };
        case 'employees':
            return { employees: (await getSheetData(spreadsheetId, SHEETS.EMPLOYEES)).map(mapRowToEmployee) };
        case 'supplierExpenses':
            return { supplierExpenses: (await getSheetData(spreadsheetId, SHEETS.SUPPLIERS)).map(mapRowToSupplierExpense) };
        case 'structuralCosts':
            return { structuralCosts: (await getSheetData(spreadsheetId, SHEETS.STRUCTURAL_COSTS)).map(mapRowToStructuralCost) };
        default:
            return {};
     }
}

// --- DATA MODIFICATION ---

const appendRow = async (spreadsheetId: string, sheetName: string, values: any[]) => {
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [values] }
    });
};

const updateRow = async (spreadsheetId: string, sheetName: string, rowIndex: number, values: any[]) => {
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [values] }
    });
};

const deleteRow = async (spreadsheetId: string, sheetName: string, rowIndex: number) => {
    const sheetResponse = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetResponse.result.sheets?.find(s => s.properties?.title === sheetName);
    if (!sheet || !sheet.properties?.sheetId) throw new Error(`Sheet ${sheetName} not found.`);
    
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: sheet.properties.sheetId,
                        dimension: 'ROWS',
                        startIndex: rowIndex - 1,
                        endIndex: rowIndex
                    }
                }
            }]
        }
    });
};

// Specific add/update/delete functions for each data type
export const addCashFlowSession = (spreadsheetId: string, data: Pick<CashFlowSession, 'date'|'description'>) => appendRow(spreadsheetId, SHEETS.CASH_FLOW, mapSessionToRow({...data, income: null, expenses: [], workedHours: []}));
export const updateCashFlowSession = (spreadsheetId: string, rowIndex: number, data: CashFlowSession) => updateRow(spreadsheetId, SHEETS.CASH_FLOW, rowIndex, mapSessionToRow(data));
export const deleteCashFlowSession = (spreadsheetId: string, rowIndex: number) => deleteRow(spreadsheetId, SHEETS.CASH_FLOW, rowIndex);

export const addEmployee = (spreadsheetId: string, data: Omit<Employee, 'id'|'rowIndex'>) => appendRow(spreadsheetId, SHEETS.EMPLOYEES, mapEmployeeToRow(data));
export const deleteEmployee = (spreadsheetId: string, rowIndex: number) => deleteRow(spreadsheetId, SHEETS.EMPLOYEES, rowIndex);

export const addSupplierExpense = (spreadsheetId: string, data: Omit<SupplierExpense, 'id'|'rowIndex'>) => appendRow(spreadsheetId, SHEETS.SUPPLIERS, mapSupplierExpenseToRow(data));
export const deleteSupplierExpense = (spreadsheetId: string, rowIndex: number) => deleteRow(spreadsheetId, SHEETS.SUPPLIERS, rowIndex);

export const addStructuralCost = (spreadsheetId: string, data: Omit<StructuralCost, 'id'|'rowIndex'>) => appendRow(spreadsheetId, SHEETS.STRUCTURAL_COSTS, mapStructuralCostToRow(data));
export const updateStructuralCost = (spreadsheetId: string, rowIndex: number, data: Omit<StructuralCost, 'id'|'rowIndex'>) => updateRow(spreadsheetId, SHEETS.STRUCTURAL_COSTS, rowIndex, mapStructuralCostToRow(data));
export const deleteStructuralCost = (spreadsheetId: string, rowIndex: number) => deleteRow(spreadsheetId, SHEETS.STRUCTURAL_COSTS, rowIndex);

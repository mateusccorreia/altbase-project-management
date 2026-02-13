import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { LogLevel, PnPLogging } from "@pnp/logging";
import type { Project } from "../types";
import { SP_FIELD_MAP } from "../types";

// ============================================================
// SharePoint Configuration
// ============================================================

const SHAREPOINT_SITE_URL = "https://your-tenant.sharepoint.com/sites/your-site";
const LIST_NAME = "Base-Projetos-Grandes-Reparos"; // Nome de Exibição (com hífens)

// ============================================================
// SharePoint Connection (for SPFx context)
// ============================================================

let _sp: ReturnType<typeof spfi> | null = null;

/**
 * Initialize the PnPjs SP instance.
 * In a real SPFx webpart, pass the webpart context.
 * For standalone apps, use MSAL authentication.
 */
export const initSP = (context?: any) => {
    if (context) {
        _sp = spfi(SHAREPOINT_SITE_URL)
            .using(SPFx(context))
            .using(PnPLogging(LogLevel.Warning));
    }
    return _sp;
};

export const getSP = () => _sp;

// ============================================================
// SharePoint REST API (for standalone React apps)
// ============================================================

/**
 * Fetch all projects from the SharePoint list using REST API.
 * Uses relative path '/sites/...' to leverage Vite proxy in local dev.
 */
export async function fetchProjectsFromSP(fullSiteUrl: string): Promise<Project[]> {
    // Extract the relative path (e.g. "/sites/MySite") from the full URL
    // This allows the Vite proxy to handle the request to https://tenant.sharepoint.com
    let siteRelativeUrl = fullSiteUrl;
    try {
        const urlObj = new URL(fullSiteUrl);
        siteRelativeUrl = urlObj.pathname;
    } catch {
        // If it's already relative or invalid, leave as is
    }

    // Construct API URL
    // If running locally (npm run dev), this hits http://localhost:5173/sites/... -> Proxied to Real SP
    const apiUrl = `${siteRelativeUrl}/_api/web/lists/getbytitle('${LIST_NAME}')/items?$top=500`;

    console.log(`Fetching from: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Accept: "application/json;odata=verbose",
                // 'X-RequestDigest': '...' // Might be needed for POST, usually not for GET
            },
            // Important: this sends your browser's SP cookies (if you are logged into SP in another tab)
            // NOTE: This only works if the proxy target domain matches your SP domain
            credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error(`Acesso negado (${response.status}). Certifique-se de estar logado no SharePoint no navegador.`);
        }

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`SharePoint API error: ${response.status} ${response.statusText} - ${txt.substring(0, 100)}`);
        }

        const data = await response.json();
        const items = data.d?.results || data.value; // Support both verbose and v2 response formats

        if (!items) {
            console.warn("Estrutura de resposta inesperada:", data);
            return [];
        }

        return items.map((item: any, index: number) => mapSPItemToProject(item, index));
    } catch (error) {
        console.error("Error fetching from SharePoint:", error);
        throw error;
    }
}

/**
 * Maps a raw SharePoint list item to our Project interface.
 * Adjust field internal names as needed.
 */
function mapSPItemToProject(item: any, index: number): Project {
    return {
        id: item.Id || index + 1,
        title: item[SP_FIELD_MAP.title] || "",
        coordinator: item[SP_FIELD_MAP.coordinator] || "",
        status: item[SP_FIELD_MAP.status] || "Não Iniciado",
        startDate: item[SP_FIELD_MAP.startDate]
            ? new Date(item[SP_FIELD_MAP.startDate]).toISOString().split("T")[0]
            : "",
        endDate: item[SP_FIELD_MAP.endDate]
            ? new Date(item[SP_FIELD_MAP.endDate]).toISOString().split("T")[0]
            : "",
        progress: item[SP_FIELD_MAP.progress] || 0,
        budgetCost: item[SP_FIELD_MAP.budgetCost] || 0,
        actualCost: item[SP_FIELD_MAP.actualCost] || 0,
        comments: item[SP_FIELD_MAP.comments] || "",
    };
}

/**
 * Fetch projects using PnPjs (for SPFx webpart context).
 */
export async function fetchProjectsWithPnP(): Promise<Project[]> {
    const sp = getSP();
    if (!sp) {
        throw new Error("SP not initialized. Call initSP(context) first.");
    }

    const items = await sp.web.lists
        .getByTitle(LIST_NAME)
        .items
        .select(
            "Id",
            SP_FIELD_MAP.title,
            SP_FIELD_MAP.coordinator,
            SP_FIELD_MAP.status,
            SP_FIELD_MAP.startDate,
            SP_FIELD_MAP.endDate,
            SP_FIELD_MAP.progress,
            SP_FIELD_MAP.budgetCost,
            SP_FIELD_MAP.actualCost,
            SP_FIELD_MAP.comments
        )
        .top(500)();

    return items.map((item: any, index: number) => mapSPItemToProject(item, index));
}

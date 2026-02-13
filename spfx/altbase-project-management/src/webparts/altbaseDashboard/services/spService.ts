import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { LogLevel, PnPLogging } from "@pnp/logging";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IProject } from "../types";
import { SP_FIELD_MAP } from "../types";

// ============================================================
// SharePoint Configuration
// ============================================================

const LIST_NAME = "Base-Projetos-Grandes-Reparos";

// ============================================================
// PnPjs SP instance (initialized via SPFx context)
// ============================================================

let _sp: ReturnType<typeof spfi> | undefined = undefined;

/**
 * Initialize the PnPjs SP instance using the SPFx webpart context.
 * This provides automatic authentication — no manual token needed.
 */
export const initSP = (context: WebPartContext): void => {
    _sp = spfi().using(
        SPFx(context),
        PnPLogging(LogLevel.Warning)
    );
};

export const getSP = (): ReturnType<typeof spfi> | undefined => _sp;

// ============================================================
// Fetch projects from SharePoint list
// ============================================================

/**
 * Fetch all projects from the SharePoint list using PnPjs.
 * Leverages the SPFx context for seamless authentication.
 */
export async function fetchProjectsFromSP(): Promise<IProject[]> {
    const sp = getSP();
    if (!sp) {
        throw new Error("SP not initialized. Call initSP(context) first in the webpart.");
    }

    try {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return items.map((item: any, index: number) => mapSPItemToProject(item, index));
    } catch (error) {
        console.error("Error fetching from SharePoint:", error);
        throw error;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSPItemToProject(item: any, index: number): IProject {
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

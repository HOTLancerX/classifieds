import DirectoryGridClient from "./DirectoryGridClient";
import { getHooks } from "@/hook";

interface DirectoryCatProps {
    data: {
        _id: string;
        title: string;
        slug: string;
        description?: string;
        shortDescription?: string;
        status: string;
        info?: Record<string, string>;
    };
    settings?: Record<string, any>;
    permalinkMap?: Record<string, string>;
    pageData?: {
        items?: any[];
        categories?: any[];
        locations?: any[];
        activeBox?: { label: string; pluginNx: string } | null;
    };
    searchParams?: Record<string, string | string[] | undefined>;
}

function resolveBoxComponent(
    activeBox: { label: string; pluginNx: string } | null
): React.ComponentType<any> | null {
    const boxes = getHooks("root.pages").filter(
        (p) => p.type === "directory-box" && p.slug === "dynamic"
    );
    if (!boxes.length) return null;

    if (activeBox) {
        const match = boxes.find(
            (b) => b.label === activeBox.label && b.pluginNx === activeBox.pluginNx
        );
        if (match?.component) return match.component;
    }

    return (boxes.find((b) => b.active === true) ?? boxes[0])?.component ?? null;
}

export default function DirectoryCategoryLayout1({
    data,
    settings = {},
    permalinkMap = {},
    pageData,
    searchParams = {},
}: DirectoryCatProps) {
    const items = pageData?.items ?? [];
    const allCategories = pageData?.categories ?? [];
    const locationNodes = pageData?.locations ?? [];
    const activeBox = pageData?.activeBox ?? null;

    const directoryPrefix = (permalinkMap["directory"] ?? "directory")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const catPrefix = (permalinkMap["directory-category"] ?? "directory/category")
        .trim()
        .replace(/^\/+|\/+$/g, "");

    const BoxComponent = resolveBoxComponent(activeBox);

    return (
        <DirectoryGridClient
            categoryTitle={data.title}
            categoryDescription={data.description || data.shortDescription}
            items={items}
            allCategories={allCategories}
            locationNodes={locationNodes}
            directoryPrefix={directoryPrefix}
            catPrefix={catPrefix}
            BoxComponent={BoxComponent}
        />
    );
}


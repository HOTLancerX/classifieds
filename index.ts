import { addHook, addPostType, addCatType, type PluginMeta } from "@/hook";
import { Select } from "@/components/ui";
import ClassifiedAttributes from "./ui/ClassifiedAttributes";
import ClassifiedsBox3 from "./box/Box-3";
import DirectoryCategoryLayout1 from "./category/DirectoryCategoryLayout1";
import DirectoryLayout1 from "./details/DirectoryLayout1";

// ─── Plugin Metadata ─────────────────────────────────────────────────────────
export const PLUGINS: PluginMeta = {
    nx: "classifieds",
    name: "classifieds",
    version: "1.0.0",
    description: "Classifieds plugin with categories, locations, box designs, details layout, and attributes.",
    author: "System",
    path: "https://github.com/HOTLancerX/classifieds.git",
    icon: "solar:shop-bold",
    color: "from-amber-500 to-orange-600",
};

/**
 * Register hooks for the Classifieds plugin.
 */
export function register() {
    // ─── Post & Category Types ───────────────────────────────────────────────
    addPostType(
        [
            {
                key: "classifieds",
                label: "Classifieds",
                icon: "solar:shop-bold",
                color: "from-amber-500 to-orange-600",
                position: 45,
                hasCategory: true,
            },
        ],
        PLUGINS.nx
    );

    addCatType(
        [
            {
                key: "classifieds-category",
                label: "Classifieds Category",
                postType: "classifieds",
                icon: "solar:folder-with-files-bold",
                color: "from-amber-500 to-orange-600",
                position: 45,
            },
            {
                key: "classifieds-country",
                label: "Location (Country / Region / City)",
                postType: "classifieds",
                icon: "solar:global-bold",
                color: "from-sky-500 to-indigo-600",
                position: 46,
            },
            {
                key: "directory-attribute",
                label: "Directory Attributes",
                postType: "directory",
                icon: "solar:list-bold",
                color: "from-purple-500 to-pink-600",
                position: 42,
            },
        ],
        PLUGINS.nx
    );

    // ─── Admin Navigation (Submenu under parent: "directory") ─────────────────
    addHook(
        "admin.nav",
        [
            {
                key: "directory-attributes",
                label: "Attributes",
                icon: "solar:list-bold",
                slug: "category/directory-attribute",
                parent: "directory",
                position: 5,
            },
        ],
        PLUGINS.nx
    );

    // ─── Page Templates (Root Pages) ─────────────────────────────────────────
    addHook(
        "root.pages",
        [
            {
                key: "directory-detail-classifieds-1",
                label: "Directory Detail Layout (Classifieds)",
                type: "directory",
                slug: "dynamic",
                style: "left",
                position: 2,
                component: DirectoryLayout1,
            },
            {
                key: "directory-cat-layout-classifieds-1",
                label: "Classifieds Category",
                type: "directory-category",
                slug: "dynamic",
                style: "left",
                position: 2,
                component: DirectoryCategoryLayout1,
            },
            {
                key: "directory-box-3",
                label: "Box 3",
                type: "directory-box",
                slug: "dynamic",
                style: "left",
                position: 3,
                component: ClassifiedsBox3,
            },
        ],
        PLUGINS.nx
    );

    // ─── Attributes Category Form Fields (cat.form) ───────────────────────────
    addHook(
        "cat.form",
        [
            {
                key: "linkedCategories",
                label: "Linked Categories",
                type: "directory-attribute",
                style: "left",
                position: 5,
                fieldType: "linked-cats",
                linkedCatType: "directory-category",
            },
            {
                key: "displayType",
                label: "Attribute Display Type",
                type: "directory-attribute",
                style: "right",
                position: 10,
                component: Select,
                options: [
                    { label: "Checkboxes (Multiple Selection)", value: "checkbox" },
                    { label: "Radio Buttons (Single Selection)", value: "radio" },
                    { label: "Dropdown Select (Single Selection)", value: "select" },
                ],
            },
        ],
        PLUGINS.nx
    );

    // ─── Post Form Fields ───────────────────────────────────────────────────
    addHook(
        "post.form",
        [
            {
                key: "social",
                active: false,
            },
            {
                key: "address",
                active: false,
            },
            {
                key: "directory_attributes",
                label: "Attributes",
                type: "directory",
                style: "left",
                position: 8,
                component: ClassifiedAttributes,
            },
        ],
        PLUGINS.nx
    );
}

export default { PLUGINS, register };

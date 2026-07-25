import DirectoryDetailsClient from "./DirectoryDetailsClient";

interface DirectoryPageProps {
    data: {
        _id: string;
        title: string;
        slug: string;
        status: string;
        category?: string;
        userId?: string;
        createdAt?: string;
        updatedAt?: string;
        info: Record<string, string>;
    };
    settings?: Record<string, any>;
    permalinkMap?: Record<string, string>;
    pageData?: {
        ancestors?: { _id: string; title: string; slug: string }[];
    };
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function buildUrl(prefix: string, slug: string): string {
    const p = prefix.trim().replace(/^\/+|\/+$/g, "");
    return p ? `/${p}/${slug}` : `/${slug}`;
}

export default function DirectoryLayout1({
    data,
    settings = {},
    permalinkMap = {},
    pageData,
}: DirectoryPageProps) {
    const defaultImages = parseJson<string[]>(data.info?.images, []);
    const description = data.info?.description ?? "";
    const htmlDescription = data.info?.htmlDescription ?? "";

    const addressData = parseJson<Record<string, string>>(data.info?.address, {});
    const contactData = parseJson<Record<string, string>>(data.info?.contact, {});
    const socialData = parseJson<any[]>(data.info?.social, []);
    const openingTimesData = parseJson<Record<string, any>>(data.info?.openingTimes, {});
    const menuData = parseJson<any>(data.info?.menu, null);
    const videosData = parseJson<any>(data.info?.videos, null);
    const qnaData = parseJson<any>(data.info?.qna, null);

    const ancestors = pageData?.ancestors ?? [];
    const catPrefix = (permalinkMap["directory-category"] ?? "directory/category")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const categoryLinks = ancestors.map((cat) => ({
        title: cat.title,
        url: buildUrl(catPrefix, cat.slug),
    }));

    // Build location path links from addressData if available
    const locationPrefix = (permalinkMap["directory-country"] ?? "directory/country")
        .trim()
        .replace(/^\/+|\/+$/g, "");
    const locationLinks: { title: string; url: string }[] = [];

    if (addressData.countryName) {
        locationLinks.push({
            title: addressData.countryName,
            url: buildUrl(locationPrefix, addressData.countryId || addressData.countryName),
        });
    }
    if (addressData.regionName) {
        locationLinks.push({
            title: addressData.regionName,
            url: buildUrl(locationPrefix, addressData.regionId || addressData.regionName),
        });
    }
    if (addressData.cityName) {
        locationLinks.push({
            title: addressData.cityName,
            url: buildUrl(locationPrefix, addressData.cityId || addressData.cityName),
        });
    }

    const ownerUserId = data.userId || data.info?.userId || "";

    return (
        <DirectoryDetailsClient
            data={{
                id: String(data._id),
                title: data.title,
                slug: data.slug,
                category: data.category,
                userId: ownerUserId,
                createdAt: data.createdAt,
                info: data.info,
            }}
            categoryLinks={categoryLinks}
            locationLinks={locationLinks}
            allImages={defaultImages}
            description={description}
            htmlDescription={htmlDescription}
            addressData={addressData}
            contactData={contactData}
            socialData={socialData}
            openingTimesData={openingTimesData}
            menuData={menuData}
            videosData={videosData}
            qnaData={qnaData}
            permalinkMap={permalinkMap}
            ownerUserId={ownerUserId}
        />
    );
}

import { useTranslations } from "next-intl";

export default function Index() {
  const t = useTranslations("Index");
  return <h1>{t("subtitle")}</h1>;
}

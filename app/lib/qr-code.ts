import QRCode from "qrcode";
import { getMenuUrl, type QrLocale } from "./qr-menu";

export async function generateTableQrDataUrl(
  baseUrl: string,
  token: string,
  locale: QrLocale = "tr"
) {
  const url = getMenuUrl(baseUrl, token, locale);
  return QRCode.toDataURL(url, {
    margin: 2,
    width: 512,
    color: {
      dark: "#171613",
      light: "#f3f1eb",
    },
  });
}

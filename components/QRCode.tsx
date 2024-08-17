import QRCode from "qrcode";
import Image from "next/image";

async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url);
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

export default async function QRCodeGenerator({ url }: { url: string }) {
  const qrCodeDataURL = await generateQRCode(url);

  return <Image src={qrCodeDataURL} alt="QR Code" width={200} height={200} />;
}

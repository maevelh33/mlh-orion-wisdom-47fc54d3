const LOVABLE_ASSET_ORIGIN = "https://2ec2cc5f-1ce9-4706-9f2c-981295f282b5.lovableproject.com";

type LovableAsset = {
  url: string;
};

export const getAssetUrl = (asset: LovableAsset) => {
  if (asset.url.startsWith("http://") || asset.url.startsWith("https://")) {
    return asset.url;
  }

  return `${LOVABLE_ASSET_ORIGIN}${asset.url.startsWith("/") ? "" : "/"}${asset.url}`;
};
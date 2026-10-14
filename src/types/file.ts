import { convertFileSrc } from "@tauri-apps/api/core";

export function getFileUrl(
    path: string
){
    return convertFileSrc(
        path
    );
}

// было C:/documents/Proj/xenimini/attachments/image.png
// Теперь: asset: //localhost/Proj/xenimini/attachments/image.png
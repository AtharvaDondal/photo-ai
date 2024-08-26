"use server";

import { actionClient } from "@/lib/safe-action";
import { Buffer } from "buffer";
import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import z from "zod";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

const formData = z.object({
    image: z.instanceof(FormData)
})

export const uploadImage = actionClient
    .schema(formData)
    .action(async ({ parsedInput: { image } }) => {
        const formImage = image.get("image")

        if (!formImage) return { error: "No Image was Provided" }
        if (!image) return { error: "No Image was Provided" }

        const file = formImage as File
        type UploadResult =
            | { success: UploadApiResponse; error?: never }
            | { error: string; success?: never }

        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            return new Promise<UploadResult>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream({
                    upload_preset: process.env.CLOUDINARY_NAME
                }, (error, result) => {
                    if (error || !result) {
                        reject({ error: "Upload Failed" })
                    } else {
                        resolve({ success: result })
                    }
                })
                uploadStream.end(buffer)
            })
            // return new Promise<UploadResult>((resolve, reject) => {
            //     const uploadStream = cloudinary.uploader.upload_stream(
            //         (error, result) => {
            //             if (error) {
            //                 console.error("Cloudinary Upload Error:", error);
            //                 reject({ error: `Upload Failed: ${error.message}` });
            //             } else if (!result) {
            //                 reject({ error: "Upload Failed: No result returned" });
            //             } else {
            //                 resolve({ success: result });
            //             }
            //         }
            //     );
            //     uploadStream.end(buffer);
            // });
        } catch (error) {
            return { error: error }
        }
    })
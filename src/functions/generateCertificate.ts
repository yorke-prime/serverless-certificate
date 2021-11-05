import chromium from "chrome-aws-lambda";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import dayjs from "dayjs";

import { document } from "../utils/dynamodbClient";
import process from "process";

interface ICreateCertificate {
    id: string;
    name: string;
    grade: string;
}

interface ITemplate {
    id: string;
    name: string;
    grade: string;
    date: string;
    medal: string;
}

const compile = async function(data: ITemplate) {
    const filPath = path.join(process.cwd(), "src", "templates", "certificate.hbs");

    const html = fs.readFileSync(filPath, "utf-8");

    return handlebars.compile(html)(data);
}


export const handle = async (event) => {
    const { id, name, grade } = JSON.parse(event.body) as ICreateCertificate;

    await document.put({
        TableName: "users_certificate",
        Item: {
            id,
            name,
            grade
        }
    }).promise();

    const medalPath = path.join(process.cwd(), "src", "templates", "selo.png");
    const medal = fs.readFileSync(medalPath, "base64");
    const data: ITemplate = {
        date: dayjs().format("DD/MM/YY"),
        id,
        grade,
        name,
        medal,
    }

    const content = await compile(data);

    const browser = await chromium.puppeteer.launch({
        headless: true,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath
    });

    const page = await browser.newPage();

    await page.setContent(content);

    const pdf = await page.pdf({
        format: "a4",
        landscape: true,
        path: process.env.IS_OFFLINE ? "certificate.pdf" : null,
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();

    return {
        statusCode: 201,
        body: JSON.stringify({
            message: "Certificate Created",
        }),
        headers: {
            "Content-type":"application/json",
        },
    };
};
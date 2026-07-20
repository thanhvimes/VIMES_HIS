import { Request, Response } from "express";
import HttpRequest from "../../../lib/http_request";
import DB from "../../../lib/dbcore";
import { rsvgVersion } from "canvas/types";
import { stat } from "fs";
import { Sign } from "crypto";
/* ================== BIẾN TOÀN CỤC ================== */
let vUrlBase = "";  // URL base của SignHSM Server

/* ================== SIGN SERVER CACHE ================== */   
type SignServerCacheItem = {
  url: string;
  expiredAt: number;
};

type TokenCacheItem = {
  token: string;
  expiredAt: number;
};

const tokenCacheMap = new Map<string, TokenCacheItem>();

function getTokenCacheKey(mid: string, userName: string) {
  return `${mid}::${userName}`;
}
const signServerCache = new Map<string, SignServerCacheItem>();

const SIGN_SERVER_CACHE_TTL = 10 * 60 * 1000; // 10 phút

async function GetUrlBase(partner: string): Promise<string> {

  const now = Date.now();
  const cached = signServerCache.get(partner);

  // 1. Cache còn hạn → dùng luôn
  if (cached && cached.expiredAt > now) {
    console.log(
      `Có sẵn ko cần gọi [SIGN-SERVER-CACHE] hit partner=${partner}, url=${cached.url}`
    );
    return cached.url;
  }
  // Lấy URL base từ config hoặc biến môi trường
 const sql=`select sign_url from hms_sign_serverconf where sign_partner ='${partner}'`;
 //console.log(sql);
 const res = await DB.query(sql, []);
 if (res.rows.length <= 0) {
    throw new Error("NO_SIGN_SERVER_CONFIG");
  }

  const fullUrl = res.rows[0].sign_url;
  const baseUrl = new URL(fullUrl).origin;

  // 3. Ghi lại cache
  signServerCache.set(partner, {
    url: baseUrl,
    expiredAt: now + SIGN_SERVER_CACHE_TTL
  });

  console.log(
    `[SIGN-SERVER-CACHE] refresh partner=${partner}, url=${baseUrl}`
  );

  return baseUrl;
}

/* ================== TOKEN CACHE ================== */
const tokenCache: {
  token: string;
  expiredAt: number;
} | null = null;

/* ================== LOGIN – LẤY TOKEN ================== */
async function login(
  baseUrl: string,
  userName: string,
  password: string,
  mid: string
): Promise<string> {

  const key = getTokenCacheKey(mid, userName);
  const now = Date.now();
  const cached = tokenCacheMap.get(key);

  // 1. Cache còn hạn
  if (cached && cached.expiredAt > now) {
    return cached.token;
  }

  // 2. Gọi login mới
  const url = `${baseUrl}/api/v1/signature/login`;
  const httpReq = new HttpRequest(url);

  const body = {
    user_Name: userName,
    password,
    ip: "127.0.0.1",
    mid
  };

  const resBody = await httpReq.post("", body, {
    "Content-Type": "application/json"
  });

  let json;
  try {
    json = JSON.parse(resBody);
  } catch {
    throw new Error("LOGIN_RESPONSE_NOT_JSON");
  }

  if (!json.success) {
    throw new Error("LOGIN_FAILED");
  }

  tokenCacheMap.set(key, {
    token: json.result.bearer_token,
    expiredAt: now + json.result.expires_in * 1000 - 5000
  });

  return json.result.bearer_token;
}

/* ================== LẤY CHỨNG THƯ ================== */
async function getCredentialId(
  baseUrl: string,
  token: string,
  userName: string,
  password: string,
  mid: string
): Promise<string> {

  const url = `${baseUrl}/api/v1/Signature/credentials/list`;
  const httpReq = new HttpRequest(url);

  const body = {
    mid,
    user_Name: userName,
    password,
    ip: "127.0.0.1"
  };

  const resBody = await httpReq.post("", body, {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  });

  let json;
  try {
    json = JSON.parse(resBody);
  } catch {
    throw new Error("CREDENTIAL_RESPONSE_NOT_JSON");
  }

  if (!json.success || !json.result || json.result.length === 0) {
    throw new Error("NO_VALID_CREDENTIAL");
  }

  return json.result[0].credential_id;
}

/* ================== KÝ XML ================== */
 export const signXml =  async function signXml(
  xmlBase64: string,
  userName: string,
  password: string,
  mid: string
): Promise<string> {
  // Cập nhật URL base của SignHSM Server
  vUrlBase = await GetUrlBase(mid);

  // 1. login lấy token
  const token = await login(vUrlBase,userName, password, mid);

  // 2. lấy chứng thư
  const credentialId = await getCredentialId(
    vUrlBase,
    token,
    userName,
    password,
    mid
  );

  // 3. gọi API ký
  const url = `${vUrlBase}/api/xml/sign/multi`;
  const httpReq = new HttpRequest(url);

  const body = {
    mid,
    user_Name: userName,
    password,
    ip: "127.0.0.1",

    credential_id: credentialId,

    computer_name: "Lieunt",
    mac: "20-47-47-26-11-87",
    os: "Windows 10",

    data_type: 1,

    file_datas: [
      {
        store_data: false,
        page_sign: 1,
        file_name: "signed.xml",
        signature_name: "nguoithuchien",
        point_x: 150,
        point_y: 150,
        width: 100,
        height: 100,
        store_uid: "",
        xml_data: xmlBase64,
        image_data: ""
      }
    ],

    image_data: ""
  };

  //console.log(body);
  const resBody = await httpReq.post("", body, {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  });

  //console.log(resBody);

  let json;
  try {
    json = JSON.parse(resBody);
  } catch {
    throw new Error("SIGN_RESPONSE_NOT_JSON");
  }

  if (!json.result?.[0]?.success) {
    throw new Error("SIGN_FAILED");
  }

  return json.result?.[0]?.signed_xml_base64 || "";
};

/* ================== API HANDLER ================== */
export const postSignXML = async (req: Request, res: Response) => {
  try {
    const { xmlBase64, userName, password, mid } = req.body;

    if (!xmlBase64 || !userName || !password || !mid) {
      return res.status(400).json({
        success: false,
        statusCode:400,
        message: "Thiếu xmlBase64 / userName / password / mid"
      });
    }
    
    const signedXml = await signXml(
      xmlBase64,
      userName,
      password,
      mid
    );

  //  console.log("Signed XML Base64:", signedXml);
    return res.status(200).json({
      success: true,
      statusCode:200,
      message: "Ký XML thành công",
      signedXml
    });
    

  } catch (e: any) {
    console.error("SIGN XML ERROR:", e);

    return res.status(500).json({
      success: false,
      statusCode:500,
      message: e.message
    });
  }
};


export const signXmlUSBAgement =  async function signXmlUSBAgement(
  ip: string,
  unsignedXml: string
): Promise<string> {

  // 3. gọi API ký
  const url = `http://${ip}:2100/sign?mode=node`;
  const httpReq = new HttpRequest(url);

  //console.log(body);
  const resBody = await httpReq.post("", unsignedXml, {
    "Content-Type": "application/xml",
    "X-Sign-Mode": "node",
    "Connection": "close"
  });
  // resboby là XML trong đó có thẻ <Signature  kiểm tra nếu có thẻ này thì là ký thành công còn ko báo là ký lỗi
 if(resBody.includes("<Signature")) {
  return resBody;
 } else {
  throw new Error("SIGN_FAILED");
 }

  return "";
};




import { GoogleGenAI } from "@google/genai";
import { MedicalRecord } from "../types";

export const explainMedicalRecord = async (record: MedicalRecord): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Bạn là một trợ lý y tế ảo thân thiện. Hãy giải thích ngắn gọn, dễ hiểu cho bệnh nhân ${record.patientName} về kết quả khám bệnh của họ.
      
      Thông tin khám:
      - Chẩn đoán: ${record.diagnosis}
      - Kết quả xét nghiệm:
      ${record.labResults.map(r => `- ${r.name}: ${r.value} ${r.unit} (${r.is_abnormal ? 'Bất thường' : 'Bình thường'})`).join('\n')}
      
      Hãy tập trung giải thích các chỉ số bất thường và đưa ra lời khuyên chung về lối sống dựa trên chẩn đoán (không kê đơn thuốc, chỉ khuyên về chế độ ăn/nghỉ ngơi). Giọng văn an ủi, động viên. Dưới 150 từ.
    `;

    /**
     * Use 'gemini-3-flash-preview' for basic text analysis and summarization tasks.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Hiện tại không thể phân tích dữ liệu. Vui lòng hỏi trực tiếp bác sĩ.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Lỗi kết nối đến hệ thống AI. Vui lòng thử lại sau.";
  }
};

export const generateFeedbackResponse = async (rating: number, comment: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Người dùng vừa đánh giá dịch vụ bệnh viện với số điểm: ${rating}/5 sao.
      Nhận xét: "${comment || 'Không có nhận xét chi tiết'}".
      
      Hãy viết một lời cảm ơn ngắn gọn (dưới 50 từ) thay mặt bệnh viện. 
      Nếu điểm thấp (1-3 sao), hãy xin lỗi chân thành và cam kết cải thiện.
      Nếu điểm cao (4-5 sao), hãy cảm ơn sự tin tưởng.
    `;

    /**
     * Use 'gemini-3-flash-preview' for general text generation tasks.
     */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Cảm ơn ý kiến đóng góp của bạn!";
  } catch (error) {
    return "Cảm ơn bạn đã dành thời gian đánh giá dịch vụ của chúng tôi.";
  }
};

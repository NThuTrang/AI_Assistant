package com.dsa.assistant.service.ai;

import com.dsa.assistant.entity.ChatMessage;
import com.google.gson.*;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.time.Duration;

/**
 * AI Service - integrates with Gemini API (primary) or OpenAI (fallback).
 * Handles prompt building, context management, streaming.
 */
@Service
@Slf4j
public class AiService {

    @Value("${ai.provider}")
    private String provider;

    @Value("${ai.gemini.api-key}")
    private String geminiApiKey;
    @PostConstruct
    public void testKey() {
        System.out.println("GEMINI KEY = " + geminiApiKey);
    }

    @Value("${ai.gemini.model}")
    private String geminiModel;

    @Value("${ai.gemini.api-url}")
    private String geminiApiUrl;

    @Value("${ai.openai.api-key}")
    private String openaiApiKey;

    @Value("${ai.openai.model}")
    private String openaiModel;

    @Value("${ai.openai.api-url}")
    private String openaiApiUrl;

    @Value("${ai.max-tokens}")
    private int maxTokens;

    @Value("${ai.temperature}")
    private double temperature;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(Duration.ofSeconds(30))
            .readTimeout(Duration.ofSeconds(120))
            .writeTimeout(Duration.ofSeconds(30))
            .build();

    private final Gson gson = new GsonBuilder().create();

    // ======================================================
    //  DSA SYSTEM PROMPT
    // ======================================================
    private static final String DSA_SYSTEM_PROMPT = """
            Bạn là **AlgoBot** - trợ giảng AI chuyên về Cấu trúc dữ liệu & Giải thuật (CTDL&GT).

            ## Vai trò:
            - Giảng viên hỗ trợ học CTDL&GT cho sinh viên CNTT
            - Giải thích rõ ràng, có ví dụ thực tế
            - Phân tích độ phức tạp thuật toán (Time & Space Complexity)
            - Sinh code minh họa (C++, Java, Python)
            - Tạo bài tập và quiz theo chủ đề

            ## Quy tắc trả lời:
            1. **Luôn trả lời bằng tiếng Việt** (trừ khi được yêu cầu khác)
            2. **Cấu trúc rõ ràng**: dùng heading, bullet points, code blocks
            3. **Có ví dụ cụ thể**: minh họa bằng mảng số, chuỗi, đồ thị đơn giản
            4. **Phân tích complexity**: luôn đề cập O(n), O(log n), v.v.
            5. **Code phải chạy được**: không pseudo code, có comment
            6. **Gợi ý học tiếp**: đề xuất chủ đề liên quan

            ## Định dạng code:
            - Luôn dùng code fence với ngôn ngữ: ```python, ```cpp, ```java
            - Có comment giải thích từng bước quan trọng
            - Có test case ví dụ

            ## Phạm vi:
            - CTDL: Array, Linked List, Stack, Queue, Tree, BST, AVL, Heap, Graph, Hash Table, Trie
            - Giải thuật: Sorting (6 loại), Searching, BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, DP, Greedy, Backtracking, Divide & Conquer
            - Phân tích thuật toán, luyện tập, phỏng vấn kỹ thuật

            ## Không trả lời:
            - Câu hỏi không liên quan đến lập trình/CTDL&GT (lịch sử, nấu ăn, v.v.)
            - Nếu hỏi ngoài phạm vi, hãy lịch sự từ chối và gợi ý chủ đề phù hợp

            Hãy bắt đầu mỗi câu trả lời với sự nhiệt tình và động viên học sinh!
            """;

    /**
     * Generate a complete AI response (non-streaming).
     * @param userMessage   The user's current message
     * @param history       Recent chat history for context (max 10 messages)
     * @return AI response text
     */
    public String generateResponse(String userMessage, List<ChatMessage> history) {
        if ("gemini".equalsIgnoreCase(provider)) {
            return callGemini(userMessage, history);
        } else {
            return callOpenAI(userMessage, history);
        }
    }

    // ---- Gemini API ----

    private String callGemini(String userMessage, List<ChatMessage> history) {
        try {
            JsonObject body = buildGeminiBody(userMessage, history);
            String url = geminiApiUrl + "/" + geminiModel + ":generateContent?key=" + geminiApiKey;

            Request request = new Request.Builder()
                    .url(url)
                    .post(RequestBody.create(gson.toJson(body), MediaType.get("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "No body";
                    log.error("Gemini API error {}: {}", response.code(), errorBody);
                    return "⚠️ Có lỗi khi kết nối AI. Vui lòng thử lại sau.";
                }

                String responseBody = response.body().string();
                return parseGeminiResponse(responseBody);
            }
        } catch (IOException e) {
            log.error("Gemini API call failed", e);
            return "⚠️ Không thể kết nối AI. Vui lòng kiểm tra kết nối mạng.";
        }
    }

    private JsonObject buildGeminiBody(String userMessage, List<ChatMessage> history) {
        JsonObject body = new JsonObject();

        // System instruction
        JsonObject systemInstruction = new JsonObject();
        JsonObject sysContent = new JsonObject();
        JsonArray sysParts = new JsonArray();
        JsonObject sysPart = new JsonObject();
        sysPart.addProperty("text", DSA_SYSTEM_PROMPT);
        sysParts.add(sysPart);
        sysContent.add("parts", sysParts);
        systemInstruction.add("parts", sysParts);
        body.add("system_instruction", systemInstruction);

        // Build conversation history
        JsonArray contents = new JsonArray();

        // Add history (last 10 messages for context)
        List<ChatMessage> recentHistory = history.size() > 10
                ? history.subList(history.size() - 10, history.size())
                : history;

        for (ChatMessage msg : recentHistory) {
            if (msg.getRole() == ChatMessage.MessageRole.SYSTEM) continue;
            JsonObject content = new JsonObject();
            content.addProperty("role",
                    msg.getRole() == ChatMessage.MessageRole.USER ? "user" : "model");
            JsonArray parts = new JsonArray();
            JsonObject part = new JsonObject();
            part.addProperty("text", msg.getContent());
            parts.add(part);
            content.add("parts", parts);
            contents.add(content);
        }

        // Add current user message
        JsonObject currentMsg = new JsonObject();
        currentMsg.addProperty("role", "user");
        JsonArray parts = new JsonArray();
        JsonObject part = new JsonObject();
        part.addProperty("text", userMessage);
        parts.add(part);
        currentMsg.add("parts", parts);
        contents.add(currentMsg);

        body.add("contents", contents);

        // Generation config
        JsonObject genConfig = new JsonObject();
        genConfig.addProperty("maxOutputTokens", maxTokens);
        genConfig.addProperty("temperature", temperature);
        body.add("generationConfig", genConfig);

        return body;
    }

    private String parseGeminiResponse(String responseBody) {
        try {
            JsonObject json = JsonParser.parseString(responseBody).getAsJsonObject();
            JsonArray candidates = json.getAsJsonArray("candidates");
            if (candidates != null && candidates.size() > 0) {
                JsonObject candidate = candidates.get(0).getAsJsonObject();
                JsonObject content = candidate.getAsJsonObject("content");
                JsonArray parts = content.getAsJsonArray("parts");
                if (parts != null && parts.size() > 0) {
                    return parts.get(0).getAsJsonObject().get("text").getAsString();
                }
            }
            return "⚠️ AI không trả về nội dung. Vui lòng thử lại.";
        } catch (Exception e) {
            log.error("Failed to parse Gemini response", e);
            return "⚠️ Lỗi phân tích phản hồi AI.";
        }
    }

    // ---- OpenAI API (fallback) ----

    private String callOpenAI(String userMessage, List<ChatMessage> history) {
        try {
            JsonObject body = buildOpenAIBody(userMessage, history);

            Request request = new Request.Builder()
                    .url(openaiApiUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + openaiApiKey)
                    .header("Content-Type", "application/json")
                    .post(RequestBody.create(gson.toJson(body), MediaType.get("application/json")))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    log.error("OpenAI API error {}", response.code());
                    return "⚠️ Lỗi khi gọi OpenAI API.";
                }
                String responseBody = response.body().string();
                return parseOpenAIResponse(responseBody);
            }
        } catch (IOException e) {
            log.error("OpenAI API call failed", e);
            return "⚠️ Không thể kết nối AI.";
        }
    }

    private JsonObject buildOpenAIBody(String userMessage, List<ChatMessage> history) {
        JsonObject body = new JsonObject();
        body.addProperty("model", openaiModel);
        body.addProperty("max_tokens", maxTokens);
        body.addProperty("temperature", temperature);

        JsonArray messages = new JsonArray();

        // System message
        JsonObject systemMsg = new JsonObject();
        systemMsg.addProperty("role", "system");
        systemMsg.addProperty("content", DSA_SYSTEM_PROMPT);
        messages.add(systemMsg);

        // History
        List<ChatMessage> recentHistory = history.size() > 10
                ? history.subList(history.size() - 10, history.size())
                : history;

        for (ChatMessage msg : recentHistory) {
            if (msg.getRole() == ChatMessage.MessageRole.SYSTEM) continue;
            JsonObject m = new JsonObject();
            m.addProperty("role", msg.getRole() == ChatMessage.MessageRole.USER ? "user" : "assistant");
            m.addProperty("content", msg.getContent());
            messages.add(m);
        }

        // Current message
        JsonObject userMsg = new JsonObject();
        userMsg.addProperty("role", "user");
        userMsg.addProperty("content", userMessage);
        messages.add(userMsg);

        body.add("messages", messages);
        return body;
    }

    private String parseOpenAIResponse(String responseBody) {
        try {
            JsonObject json = JsonParser.parseString(responseBody).getAsJsonObject();
            JsonArray choices = json.getAsJsonArray("choices");
            if (choices != null && choices.size() > 0) {
                return choices.get(0).getAsJsonObject()
                        .getAsJsonObject("message")
                        .get("content").getAsString();
            }
            return "⚠️ AI không trả về nội dung.";
        } catch (Exception e) {
            log.error("Failed to parse OpenAI response", e);
            return "⚠️ Lỗi phân tích phản hồi AI.";
        }
    }

    /**
     * Generate a quiz using AI for a specific topic and difficulty.
     */
    public String generateQuiz(String topic, String difficulty, int questionCount) {
        String prompt = String.format("""
                Tạo %d câu hỏi quiz về chủ đề "%s" ở mức độ %s.
                
                Trả về JSON theo định dạng sau (KHÔNG có markdown fence, chỉ JSON thuần):
                {
                  "title": "Quiz: [tên chủ đề]",
                  "questions": [
                    {
                      "questionText": "Câu hỏi ở đây?",
                      "questionType": "MULTIPLE_CHOICE",
                      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
                      "correctAnswer": "A. ...",
                      "explanation": "Giải thích tại sao đáp án đúng"
                    }
                  ]
                }
                
                Yêu cầu:
                - questionType có thể là: MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK
                - Câu hỏi phải đúng kiến thức CTDL&GT
                - Giải thích rõ ràng bằng tiếng Việt
                """, questionCount, topic, difficulty);

        return generateResponse(prompt, List.of());
    }

    /**
     * Analyze uploaded code for bugs and improvements.
     */
    public String analyzeCode(String code, String language) {
        String prompt = String.format("""
                Phân tích đoạn code %s sau và:
                1. Xác định thuật toán/cấu trúc dữ liệu được sử dụng
                2. Phân tích độ phức tạp: Time O(?), Space O(?)
                3. Phát hiện lỗi logic (nếu có)
                4. Gợi ý cải thiện code
                5. Viết lại phiên bản tối ưu hơn (nếu cần)
                
                Code:
                ```%s
                %s
                ```
                
                Trả lời có cấu trúc rõ ràng, dùng tiếng Việt.
                """, language, language, code);

        return generateResponse(prompt, List.of());
    }

    /**
     * Generate practice problems for a topic.
     */
    public String generatePracticeProblems(String topic, String difficulty, int count) {
        String prompt = String.format("""
                Tạo %d bài tập luyện tập về "%s" ở mức độ %s.
                
                Trả về JSON (không markdown):
                {
                  "problems": [
                    {
                      "title": "Tên bài",
                      "description": "Mô tả bài toán",
                      "constraints": "Ràng buộc",
                      "examples": [{"input": "...", "output": "...", "explanation": "..."}],
                      "hints": ["Gợi ý 1", "Gợi ý 2"],
                      "timeComplexity": "O(?)",
                      "spaceComplexity": "O(?)"
                    }
                  ]
                }
                """, count, topic, difficulty);

        return generateResponse(prompt, List.of());
    }
}
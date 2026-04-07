import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { supabase } from "./supabase";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCudkhhqYJ0sEwKH4dQJHD5Co2MHfeme2Y';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Schema for parsing transaction details from voice/text
const transactionSchema = {
  description: "Extracted transaction details from user input.",
  type: SchemaType.OBJECT,
  properties: {
    amount: {
      type: SchemaType.NUMBER,
      description: "The amount of the expense. Just the number.",
    },
    category: {
      type: SchemaType.STRING,
      description: "The category of the expense (e.g., Food, Travel, Shopping, Utility, etc).",
    },
    payment_mode: {
      type: SchemaType.STRING,
      description: "The mode of payment (Cash, UPI, Card, Bank). Map appropriately.",
    },
    date: {
      type: SchemaType.STRING,
      description: "The date of the transaction if mentioned. Use 'today' if not clearly specified.",
    }
  },
  required: ["amount", "category", "payment_mode"]
};

export async function parseExpenseInput(input: string) {
  const prompt = `
    You are an AI assistant for an expense tracker apps. 
    A user has entered the following expense description: "${input}"
    Extract the amount, category, and payment mode. 
    If the payment mode isn't explicit but implies cash (e.g., just "gave", "auto fare"), default to Cash or find clues. "Scan" "Paytm" "PhonePe" "GPay" = UPI.
    If no category is explicit, figure out the most logical category from the items mentioned. 
    Return the extracted details.
  `;
  
  const parsedModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You strictly output JSON based on the schema requested.",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: transactionSchema as any,
    }
  });

  const result = await parsedModel.generateContent(prompt);
  const responseText = result.response.text();
  try {
    return JSON.parse(responseText);
  } catch(e) {
    console.error("Failed to parse JSON form gemini:", e);
    return null;
  }
}

export async function askAssistant(question: string) {
  // First, fetch recent transactions to give the AI context.
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching transactions for AI context:", error);
    return "I'm having trouble accessing your transactions right now.";
  }

  // Calculate totals for quick context
  const totalExpense = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  
  const todayDate = new Date().toISOString().split('T')[0];
  const todayExpense = transactions?.filter(t => t.created_at.startsWith(todayDate)).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const dataContext = `
    Current context totals:
    Total Expenses All-time: ₹${totalExpense}
    Total Expenses Today: ₹${todayExpense}

    Recent up to 100 transactions data (JSON):
    ${JSON.stringify(transactions)}
  `;

  const prompt = `
    You are a helpful, simple personal finance AI assistant for a mobile app.
    The user asks in Hinglish or English: "${question}"
    Use the following transactions data to answer the query accurately:
    ${dataContext}
    
    Calculate based on the data provided if necessary. 
    Reply strictly in 1-2 concise sentences. The reply will be spoken out loud via Text-to-Speech, so do NOT use markdown or complex formatting. Keep numbers simple and clear. Prefer Hinglish or English based on user's query language.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

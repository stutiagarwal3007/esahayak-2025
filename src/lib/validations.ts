import { z } from "zod";

// Enum schemas
export const citySchema = z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]);
export const propertyTypeSchema = z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]);
export const bhkSchema = z.enum(["1", "2", "3", "4", "Studio"]);
export const purposeSchema = z.enum(["Buy", "Rent"]);
export const timelineSchema = z.enum(["0-3m", "3-6m", ">6m", "Exploring"]);
export const sourceSchema = z.enum(["Website", "Referral", "Walk-in", "Call", "Other"]);
export const statusSchema = z.enum(["New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"]);

// Main buyer schema
export const buyerSchema = z.object({
  fullName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string()
    .regex(/^\d{10,15}$/, "Phone must be 10-15 digits"),
  city: citySchema,
  propertyType: propertyTypeSchema,
  bhk: bhkSchema.optional(),
  purpose: purposeSchema,
  budgetMin: z.number().min(0, "Budget must be positive").optional(),
  budgetMax: z.number().min(0, "Budget must be positive").optional(),
  timeline: timelineSchema,
  source: sourceSchema,
  status: statusSchema.default("New"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
}).refine((data) => {
  // BHK required for Apartment/Villa
  if ((data.propertyType === "Apartment" || data.propertyType === "Villa") && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: "BHK is required for Apartments and Villas",
  path: ["bhk"]
}).refine((data) => {
  // Budget max must be >= budget min
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: "Maximum budget must be greater than or equal to minimum budget",
  path: ["budgetMax"]
});

// CSV import schema
export const csvBuyerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().regex(/^\d{10,15}$/),
  city: citySchema,
  propertyType: propertyTypeSchema,
  bhk: bhkSchema.optional().or(z.literal("")),
  purpose: purposeSchema,
  budgetMin: z.string().regex(/^\d*$/).transform(val => val === "" ? undefined : parseInt(val)).optional(),
  budgetMax: z.string().regex(/^\d*$/).transform(val => val === "" ? undefined : parseInt(val)).optional(),
  timeline: timelineSchema,
  source: sourceSchema,
  notes: z.string().max(1000).optional().or(z.literal("")),
  tags: z.string().transform(val => val ? val.split(",").map(t => t.trim()) : []).optional(),
  status: statusSchema.optional().default("New")
}).refine((data) => {
  if ((data.propertyType === "Apartment" || data.propertyType === "Villa") && !data.bhk) {
    return false;
  }
  return true;
}).refine((data) => {
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
});

export type Buyer = z.infer<typeof buyerSchema>;
export type CsvBuyer = z.infer<typeof csvBuyerSchema>;

// Type definitions
export type City = z.infer<typeof citySchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export type BHK = z.infer<typeof bhkSchema>;
export type Purpose = z.infer<typeof purposeSchema>;
export type Timeline = z.infer<typeof timelineSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Status = z.infer<typeof statusSchema>;
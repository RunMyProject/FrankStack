/**
 * saga.ts
 * -----------------------
 * TypeScript type definitions for the Saga Orchestration module.
 *
 * PURPOSE:
 * - Defines transport options returned by backend services.
 * - Declares saga step lifecycle states.
 * - Structures each saga step with its status and metadata.
 *
 * These types are used across the AI chat orchestration layer
 * to ensure consistency between frontend and backend data models.
 * They facilitate type-safe handling of saga steps,
 * including user interactions and error management.
 * They also define the structure of transport options
 * returned by various backend services.
 * This file is part of the FrankStack project:
 * BookEntry microservice, Saga Orchestration, and AI Chat Interface.
 * HotelOption, BookingEntry, TransportOption, StepStatus, SagaStep
 * Shared type definitions for AI context and payment methods.
 * -----------------------
 *
 * Author: Edoardo Sabatini
 * Date: 10 October 2025
 *
 */

/**
 * Represents a saved payment method in the store
 */
export interface SavedPaymentMethod {
  id: string;                 // internal unique id, e.g., "card_1696970000000"
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  lastFourDigits?: string;    // last 4 digits of the card
  cardType?: 'visa' | 'mastercard' | 'amex';
  token?: string;             // token returned from payment gateway (e.g., Stripe)
  timestamp?: string;         // "DD/MM/YYYY HH:mm" format, for user display
  isDefault: boolean;         // true if default card
  expiryDate?: string;        // MM/YY format
  cardholderName?: string;    // Full name on card
}

/**
 * Standard user data
 */
export interface StandardUserData {
  username: string;
  password: string;
  defaultPaymentMethods: SavedPaymentMethod[];
  defaultLanguage: string;
}

export interface CommonBookingEntry {
  id: string;
  type?: string; // plane/train/bus/car/space
  reference: string;
  price: number;
  people: number;
  bookedAt: string;
  tripDeparture: string; 
  tripDestination: string;
  dateTimeRoundTripDeparture: string;
  dateTimeRoundTripReturn: string;
}

export interface BookingEntry extends CommonBookingEntry {  
  companyName?: string;
  luggages: number;
}

// Represents a hotel booking entry in the system
export interface HotelBookingEntry extends CommonBookingEntry {
  // fields specific to hotel bookings
  hotelName: string;
  stars: number; // 1-7
  roomType: string;
  // data specs for hotel booking (should match transport booking dates if hotel covers whole trip)
  address: string;
  amenities: string[];
  rating?: number; // 1-10
  distanceFromCenter?: string;
}

export interface HotelOption {
  id: string;
  hotelName: string;
  stars: number; // 1-7
  address: string;
  duration: number; // nights
  price: number;
  roomType: string;
  amenities: string[]; // ["WiFi", "Pool", "Gym", "Spa", "Breakfast"]
  rating: number; // 1-10
  distanceFromCenter: string; // "2.5 km from city center"
  cancellationPolicy: string; // "Free cancellation", "Non-refundable", etc.
  images: string[]; // URLs
  
  departureTime: string;
  arrivalTime: string;
}

export interface TransportOption {
  id: string;
  type: string; // e.g. "plane", "train", "bus", "car", "space"
  companyName?: string;
  flightNumber?: string;
  duration: string;
  price: number;
  stops: number;
  seatClass: string;
  benefits: string[];
  departureTime: string;
  arrivalTime: string;
}

export type StepStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'error'
  | 'user_input_required';

/**
 * Represents a single step in the Saga execution pipeline.
 * Each step contains metadata, current state, and optional data or error info.
 */
export interface SagaStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  bookingEntry: BookingEntry | HotelBookingEntry;
  errorMessage?: string;
}

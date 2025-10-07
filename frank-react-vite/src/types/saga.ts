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
 * -----------------------
 *
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 *
 */

export interface BookingEntry {
  id: string;
  type: 'transport' | 'accommodation' | 'activity';
  reference: string;
  price: number;
  people: number;
  bookedAt: string;
  tripDeparture: string; 
  tripDestination: string;
  dateTimeRoundTripDeparture: string;
  dateTimeRoundTripReturn: string;
  luggages: number;
}

export interface TransportOption {
  id: string;
  type: string; // e.g. "plane", "train", "bus", "car", "space"
  airline?: string;
  flightNumber?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  stops: number;
  seatClass: string;
  benefits: string[];
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
  bookingEntry: BookingEntry;
  errorMessage?: string;
}

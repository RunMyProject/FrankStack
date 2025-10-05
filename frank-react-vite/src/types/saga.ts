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
 *
 * Author: Edoardo Sabatini
 * Date: 05 October 2025
 */

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
  data?: unknown;
  errorMessage?: string;
}

package com.frankspring.frankkafkahotelconsumer.models;

/**
 * Results.java
 * -----------------------
 * Data carrier aggregator for all transport types with Lombok support.
 * 
 * RESPONSIBILITIES:
 * - Provides read/write access to all transport data (flights, trains, buses, cars, space travel).
 * - Designed as a centralized entry point for holding transport results per booking.
 * - Acts as a unified Data Carrier Object (DCO) for the FrankStack Travel project.
 * - Facilitates frontend/backend testing and integration without altering underlying data.
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.results.HotelRecord;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HotelResults {

    private List<HotelRecord> hotels;
}

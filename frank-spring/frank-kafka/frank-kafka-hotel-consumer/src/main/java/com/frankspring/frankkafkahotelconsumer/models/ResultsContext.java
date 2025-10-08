package com.frankspring.frankkafkahotelconsumer.models;

/**
 * ResultsContext.java
 * -----------------------
 * Immutable data carrier aggregator for all transport types.
 * 
 * RESPONSIBILITIES:
 * - Provides read-only access to all transport data (flights, trains, buses, cars, space travel).
 * - Designed as a centralized entry point for generating mock transport data.
 * - Acts as a unified Data Carrier Object (DCO) for the FrankStack Travel project.
 * - Facilitates frontend/backend testing and integration without altering underlying data.
 * 
 * Author: Edoardo Sabatini
 * Date: 08 October 2025
 */

import com.frankspring.frankkafkahotelconsumer.models.results.*;

import java.util.List;

public final class ResultsContext {

    // Prevent instantiation
    private ResultsContext() {}

    /**
     * Retrieve mock hotels
     * @return List of HotelRecord objects
     */
    public static List<HotelRecord> getHotels(FillForm form, String userLang) {
        return HotelRecord.generateMockHotels(form, userLang);
    }
}

package com.frankspring.frankkafkatravelconsumer.models;

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
 * Date: 05 October 2025
 */

import com.frankspring.frankkafkatravelconsumer.models.results.*;

import java.util.List;

public final class ResultsContext {

    // Prevent instantiation
    private ResultsContext() {}

    /**
     * Retrieve mock flights.
     * @return List of FlightRecord objects
     */
    public static List<FlightRecord> getFlights() {
        return FlightRecord.generateMockFlights();
    }

    /**
     * Retrieve mock trains.
     * @return List of TrainRecord objects
     */
    public static List<TrainRecord> getTrains() {
        return TrainRecord.generateMockTrains();
    }

    /**
     * Retrieve mock buses.
     * @return List of BusRecord objects
     */
    public static List<BusRecord> getBuses() {
        return BusRecord.generateMockBuses();
    }

    /**
     * Retrieve mock cars.
     * @return List of CarRecord objects
     */
    public static List<CarRecord> getCars() {
        return CarRecord.generateMockCars();
    }

    /**
     * Retrieve mock space travel options.
     * @return List of SpaceRecord objects
     */
    public static List<SpaceRecord> getSpaces() {
        return SpaceRecord.generateMockSpaces();
    }
}

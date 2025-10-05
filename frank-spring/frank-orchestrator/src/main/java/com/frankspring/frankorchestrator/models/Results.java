package com.frankspring.frankorchestrator.models;

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
 * Date: 05 October 2025
 */

import com.frankspring.frankorchestrator.models.results.*;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Results {

    private List<FlightRecord> flights;
    private List<TrainRecord> trains;
    private List<BusRecord> buses;
    private List<CarRecord> cars;
    private List<SpaceRecord> spaces;
}

package com.frankspring.frankkafkahotelconsumer.models;

/**
 * User.java
 * -----------------------
 * Model class representing a user in the system.
 * - Can be modified (password, email, timestamps)
 * - Uses Lombok for boilerplate reduction
 * 
 * Author: Edoardo Sabatini
 * Date: 07 October 2025
 */

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    private String username;
    private String userId;
    private String email;
    private String password;
    private long lastLoginTimestamp;
}

/**
 * UserEdoardoDB.ts
 * -----------------------
 * User database with predefined payment methods.
 * Contains default user credentials and stored payment methods.
 *
 * AUTHOR: Edoardo Sabatini
 * DATE: 10 October 2025
 */

import type { StandardUserData } from '../types/saga';

/**
 * Predefined data for user "Edoardo"
 */
export const UserEdoardoData: StandardUserData = {
  username: "Edoardo",
  password: "12345",
  defaultLanguage: "Italian",
  defaultPaymentMethods: [
    {
      id: "saved_card_1",
      type: "credit_card",
      lastFourDigits: "4532",
      cardType: "visa",
      expiryDate: "12/26",
      cardholderName: "Edoardo Sabatini",
      isDefault: true,
      token: "tok_visa_4532_edoardo"
    },
    {
      id: "saved_card_2",
      type: "credit_card",
      lastFourDigits: "8765",
      cardType: "mastercard",
      expiryDate: "03/27",
      cardholderName: "Edoardo Sabatini",
      isDefault: false,
      token: "tok_mc_8765_edoardo"
    }
  ]
};

/**
 * NEW: Test user data (English)
 */
export const UserTestDataEng: StandardUserData = {
  username: "testUser",
  password: "test",
  defaultLanguage: "English",
  defaultPaymentMethods: [
    {
      id: "test_card_1",
      type: "credit_card",
      lastFourDigits: "1111",
      cardType: "visa",
      expiryDate: "11/28",
      cardholderName: "Test User",
      isDefault: true,
      token: "tok_visa_1111_test000"
    }
  ]
};

/**
 * NEW: Test user data (Italian)
 */
export const UserTestDataIta: StandardUserData = {
  username: "testUserIta",
  password: "test",
  defaultLanguage: "Italian",
  defaultPaymentMethods: [
    {
      id: "test_card_1_ita",
      type: "credit_card",
      lastFourDigits: "2222",
      cardType: "mastercard",
      expiryDate: "10/29",
      cardholderName: "Utente Test",
      isDefault: true,
      token: "tok_mc_2222_testit001"
    }
  ]
};

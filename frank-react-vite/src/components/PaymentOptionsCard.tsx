/**
 * PaymentOptionsCard.tsx
 * -----------------------------------------------------
 * Professional and fully validated payment method selector.
 * Supports:
 *   - Saved credit cards (max 2, newest-first)
 *   - New card entry
 *   - PayPal and bank transfer
 * Includes:
 *   - Full validation (Luhn, expiry, CVV, name)
 *   - Detailed logging of card data for debugging
 *
 * Author: Edoardo Sabatini
 * Date: 10 October 2025
 */

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import type { SavedPaymentMethod } from '../types/saga';

interface PaymentOptionsCardProps {
  totalAmount: number;
  selectedPaymentId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  isConfirming: boolean;
}

const PaymentOptionsCard: React.FC<PaymentOptionsCardProps> = ({
  totalAmount,
  selectedPaymentId,
  onSelect,
  onConfirm,
  isConfirming
}) => {
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  // New card input states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  // Validation error messages
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Access global store for saved cards
  const savedPaymentMethods = useAuthStore((state) => state.savedPaymentMethods);
  const addPaymentMethod = useAuthStore((state) => state.addPaymentMethod);
  const printAllPaymentMethods = useAuthStore((state) => state.printAllPaymentMethods);

  // Build list of payment options
  const paymentOptions: Array<SavedPaymentMethod | { id: string; type: string; label: string; icon: string }> = [
    ...savedPaymentMethods,
    { id: 'new_card', type: 'new_card', label: 'Add New Card', icon: '➕' },
    { id: 'paypal', type: 'paypal', label: 'PayPal', icon: '🅿️' },
    { id: 'bank_transfer', type: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' }
  ];

  // Return a visual badge for the detected card type
  const getCardBadge = (cardType?: 'visa' | 'mastercard' | 'amex') => {
    if (!cardType) return null;

    const badges = {
      visa: <span className="px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded">VISA</span>,
      mastercard: <span className="px-2 py-0.5 text-xs font-semibold bg-red-600 text-white rounded">MasterCard</span>,
      amex: <span className="px-2 py-0.5 text-xs font-semibold bg-blue-800 text-white rounded">AMEX</span>
    };

    return badges[cardType];
  };

  // Handle payment method selection
  const handleSelectPayment = (id: string) => {
    onSelect(id);
    setShowNewCardForm(id === 'new_card');
    setErrors({});
  };

  // -------------------------------
  // Validation Utility Functions
  // -------------------------------

  // Luhn algorithm for card validation
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  // Detect card type by prefix
  const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' | undefined => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    return undefined;
  };

  // Validate expiry date (MM/YY)
  const validateExpiryDate = (expiry: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  };

  // Validate CVV (3 or 4 digits)
  const validateCVV = (cvvValue: string): boolean => /^\d{3,4}$/.test(cvvValue);

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    return cleaned;
  };

  // -------------------------------
  // Input Handlers
  // -------------------------------

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 19) {
      setCardNumber(value);
      if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiryDate(formatExpiryDate(value));
      if (errors.expiryDate) setErrors((prev) => ({ ...prev, expiryDate: '' }));
    }
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
      if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: '' }));
    }
  };

  const handleCardholderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardholderName(e.target.value);
    if (errors.cardholderName) setErrors((prev) => ({ ...prev, cardholderName: '' }));
  };

  /*
   ***************
   * Stripe Server
   ***************
   */
  const fetchStripeToken = async (
    lastFourDigits: string,
    cardType: 'visa' | 'mastercard' | 'amex'
   ): Promise<{ token: string; lastFourDigits: string; cardType: string }> => {
    try {
      const response = await fetch('http://localhost:4000/getToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lastFourDigits, cardType })
      });

      if (!response.ok) {
        throw new Error('Failed to get token from MyStripeServer');
      }

      const data = await response.json();
      return data; // === { token, lastFourDigits, cardType, timestamp }
    } catch (error) {

        console.error('❌ Error during MyStripeServer token request:', error);

        // In a real application, this is where the error is handled more elegantly.
        // For the demo, we return an error token.

        return {
          token: 'tok_error_' + Date.now(),
          lastFourDigits,
          cardType
        } as unknown as { token: string; lastFourDigits: string; cardType: string };
    }
  };

  // -------------------------------
  // Save Card Handler
  // -------------------------------
  const handleSaveCard = async () => {

    const saveCard = true; // Ensures card saving is always enabled
    const newErrors: { [key: string]: string } = {};

    // Validate all fields
    if (!cardNumber || !validateCardNumber(cardNumber)) newErrors.cardNumber = 'Invalid card number';
    if (!expiryDate || !validateExpiryDate(expiryDate)) newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
    if (!cvv || !validateCVV(cvv)) newErrors.cvv = 'Invalid CVV (3-4 digits)';
    if (!cardholderName || cardholderName.trim().length < 3)
      newErrors.cardholderName = 'Cardholder name required (min 3 chars)';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 1. Detect card type and prepare metadata
    const detectedCardType = detectCardType(cardNumber);
    const lastFour = cardNumber.slice(-4);

    if (detectedCardType === undefined) {
      console.warn("Unable to detect card type");
      // Handle the case where card type couldn't be detected
      // For example, you might want to show an error to the user
      return;
    }

    // 2. NEW: Get token from the simulated server
    console.log(`📡 Requesting token for **** ${lastFour} (${detectedCardType}) from MyStripeServer...`);
    const { token } = await fetchStripeToken(lastFour, detectedCardType);

    // 3. Create the new payment method object
    const newPaymentMethod: SavedPaymentMethod = {
      id: `card_${Date.now()}`,
      type: 'credit_card',
      lastFourDigits: lastFour,
      cardType: detectedCardType,
      expiryDate: expiryDate,
      cardholderName: cardholderName.trim(),
      token: token,
      isDefault: savedPaymentMethods.length === 0
    };

    // Full debug log of card info (for development only)
    console.log('💾 ========== CARD SAVE LOG (via Token Server) ==========');
    console.log('💾 token:', newPaymentMethod.token);
    console.log('💾 ==================================');

    // 4. Save to store and continue...
    if (saveCard) {
      addPaymentMethod(newPaymentMethod);
      console.log('✅ Card saved in store (max 2, newest-first)');
      printAllPaymentMethods();
      onSelect(newPaymentMethod.id);
    } else {
      console.log('⏭️ Card NOT saved (save unchecked). Using temporary token for payment.');
      // If not saved, we use a temporary token-based ID
      onSelect(`temp_card_${newPaymentMethod.token}`); 
    }

    /* Full debug log of card info (for development only)
    console.log('💾 ========== CARD SAVE LOG ==========');
    console.log('💾 id:', newPaymentMethod.id);
    console.log('💾 type:', newPaymentMethod.type);
    console.log('💾 full cardNumber:', cardNumber);
    console.log('💾 lastFourDigits:', newPaymentMethod.lastFourDigits);
    console.log('💾 cardType:', newPaymentMethod.cardType);
    console.log('💾 expiryDate:', newPaymentMethod.expiryDate);
    console.log('💾 cvv:', cvv);
    console.log('💾 cardholderName:', newPaymentMethod.cardholderName);
    console.log('💾 token:', newPaymentMethod.token);
    console.log('💾 isDefault:', newPaymentMethod.isDefault);
    console.log('💾 saveForFuture:', saveCard);
    console.log('💾 timestamp:', new Date().toLocaleString('it-IT'));
    console.log('💾 ==================================');
    */

    // Reset form
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
    setSaveCard(false);
    setShowNewCardForm(false);
    setErrors({});
  };

  // -------------------------------
  // Render Component
  // -------------------------------

  return (
    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>💰</span>
          <span>Select payment method:</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Total amount</div>
          <div className="text-lg font-bold text-green-600">€{totalAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Payment Method List */}
      <div className="space-y-2 mb-3">
        {paymentOptions.map((method) => {
          const isSavedCard = 'lastFourDigits' in method;

          return (
            <label
              key={method.id}
              className={`flex items-center gap-3 p-2 rounded border cursor-pointer transition-all ${
                selectedPaymentId === method.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
            >
              <input
                type="radio"
                checked={selectedPaymentId === method.id}
                onChange={() => handleSelectPayment(method.id)}
                className="flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{isSavedCard ? '💳' : (method as { icon: string }).icon}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {isSavedCard ? method.cardholderName : (method as { label: string }).label}
                  </span>
                  {isSavedCard && getCardBadge(method.cardType)}
                  {isSavedCard && method.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Default</span>
                  )}
                </div>

                {isSavedCard && (
                  <div className="text-xs text-gray-600 mt-0.5 ml-7">
                    •••• •••• •••• {method.lastFourDigits} • Exp: {method.expiryDate}
                  </div>
                )}

                {method.id === 'paypal' && (
                  <div className="text-xs text-gray-600 mt-0.5 ml-7">
                    Pay securely with your PayPal account
                  </div>
                )}

                {method.id === 'bank_transfer' && (
                  <div className="text-xs text-gray-600 mt-0.5 ml-7">
                    Direct bank transfer • 1–2 business days
                  </div>
                )}
              </div>

              {isSavedCard && (
                <div className="flex-shrink-0">
                  <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                </div>
              )}
            </label>
          );
        })}
      </div>

      {/* New Card Form */}
      {showNewCardForm && selectedPaymentId === 'new_card' && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Enter card details:</div>
          <div className="space-y-2">
            {/* Card Number */}
            <div>
              <input
                type="text"
                placeholder="Card number"
                value={formatCardNumber(cardNumber)}
                onChange={handleCardNumberChange}
                className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
              />
              {errors.cardNumber && <p className="text-xs text-red-600 mt-0.5">{errors.cardNumber}</p>}
            </div>

            {/* Expiry / CVV */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                  }`}
                />
                {errors.expiryDate && <p className="text-xs text-red-600 mt-0.5">{errors.expiryDate}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="CVV"
                  value={cvv}
                  onChange={handleCVVChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                  }`}
                />
                {errors.cvv && <p className="text-xs text-red-600 mt-0.5">{errors.cvv}</p>}
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <input
                type="text"
                placeholder="Cardholder name"
                value={cardholderName}
                onChange={handleCardholderNameChange}
                className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none ${
                  errors.cardholderName ? 'border-red-500' : 'border-gray-300 focus:border-green-500'
                }`}
              />
              {errors.cardholderName && <p className="text-xs text-red-600 mt-0.5">{errors.cardholderName}</p>}
            </div>
          </div>

          {/* Save card checkbox */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="save-card"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="save-card" className="text-xs text-gray-600">
              Save this card for future payments (max 2, newest-first)
            </label>
          </div>

          <button
            onClick={handleSaveCard}
            className="w-full mt-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            💾 Save Card & Continue
          </button>
        </div>
      )}

      {/* Security Info */}
      <div className="mb-3 flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>🔒</span>
        <span>Secure payment • SSL encrypted</span>
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => {
          handleSaveCard(); // Save card and handle logic internally
          onConfirm(); // Trigger payment confirmation immediately
        }}
        disabled={isConfirming}
        className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? 'Processing Payment...' : `Pay €${totalAmount.toFixed(2)}`}
      </button>

      {/* Accepted Providers */}
      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-400">
        <span>We accept:</span>
        <div className="flex gap-2">
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded font-semibold">VISA</span>
          <span className="px-1.5 py-0.5 bg-red-600 text-white rounded font-semibold">MC</span>
          <span className="px-1.5 py-0.5 bg-blue-800 text-white rounded font-semibold">AMEX</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsCard;

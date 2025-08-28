/**
 * weatherCodes.ts
 * Weather Code Map
 * -----------------------
 * Maps numeric weather codes to an icon and localized description.
 * - Supports Italian (IT) and English (EN) translations
 * - Used to display weather conditions in the chat application
 * 
 * Author: Edoardo Sabatini
 * Date: 28 August 2025
 */

import type { Lang } from '../types/chat';

/**
 * Weather code mapping.
 * Key: numeric weather code
 * Value: tuple of [icon, localized descriptions]
 */
export const weatherCodeMap: Record<number, [string, Record<Lang, string>]> = {
  0: ["☀", { IT: "Sereno", EN: "Clear" }],
  1: ["🌤", { IT: "Prevalentemente sereno", EN: "Mostly clear" }],
  2: ["⛅", { IT: "Parzialmente nuvoloso", EN: "Partly cloudy" }],
  3: ["☁", { IT: "Nuvoloso", EN: "Cloudy" }],
  45: ["🌫", { IT: "Nebbia", EN: "Fog" }],
  48: ["🌫", { IT: "Nebbia gelata", EN: "Freezing fog" }],
  51: ["🌦", { IT: "Pioggerella leggera", EN: "Light drizzle" }],
  53: ["🌦", { IT: "Pioggerella moderata", EN: "Moderate drizzle" }],
  55: ["🌦", { IT: "Pioggerella intensa", EN: "Heavy drizzle" }],
  61: ["🌧", { IT: "Pioggia leggera", EN: "Light rain" }],
  63: ["🌧", { IT: "Pioggia moderata", EN: "Moderate rain" }],
  65: ["🌧", { IT: "Pioggia intensa", EN: "Heavy rain" }],
  71: ["🌨", { IT: "Neve leggera", EN: "Light snow" }],
  73: ["🌨", { IT: "Neve moderata", EN: "Moderate snow" }],
  75: ["🌨", { IT: "Neve intensa", EN: "Heavy snow" }],
  80: ["🌦", { IT: "Rovesci leggeri", EN: "Light showers" }],
  81: ["🌦", { IT: "Rovesci moderati", EN: "Moderate showers" }],
  82: ["🌦", { IT: "Rovesci violenti", EN: "Violent showers" }],
  95: ["⛈", { IT: "Temporale", EN: "Thunderstorm" }],
  96: ["⛈", { IT: "Temporale con grandine leggera", EN: "Thunderstorm with light hail" }],
  99: ["⛈", { IT: "Temporale con grandine intensa", EN: "Thunderstorm with heavy hail" }]
};

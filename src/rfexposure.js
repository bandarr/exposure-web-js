"use strict";

export class FrequencyValues {
  constructor(freq, swr, gaindbi) {
    this.freq    = freq;
    this.swr     = swr;
    this.gaindbi = gaindbi;
  }
}

export class CableValues {
  constructor(k1, k2) {
      this.k1 = k1;
      this.k2 = k2;
  }
}

//   Test values
//   let xmtr_power = 1000;
//   let feedline_length = 73;
//   let duty_cycle = .5;
//   let cable_values = new CableValues(0.122290, 0.000260);
//   let per_30 = .5

//   let all_frequency_values = [new FrequencyValues(7.3, 2.25, 1.5),
//                               new FrequencyValues(14.35, 1.35, 1.5),
//                               new FrequencyValues(18.1, 3.7, 1.5),
//                               new FrequencyValues(21.45, 4.45, 1.5),
//                               new FrequencyValues(24.99, 4.1, 1.5),
//                               new FrequencyValues(29.7, 2.18, 4.5)];


/**
 * 
 * @param {FrequencyValues} freq_values 
 * @param {CableValues} cable_values 
 * @param {number} transmitter_power 
 * @param {number} feedline_length 
 * @param {number} duty_cycle 
 * @param {number} uncontrolled_percentage_30_minutes 
 * @returns 
 */
export function calc_uncontrolled_safe_distance(freq_values, cable_values, transmitter_power, feedline_length, duty_cycle,
  uncontrolled_percentage_30_minutes) {

  let gamma = calc_reflection_coefficient(freq_values)

  let feedline_loss_per_100ft_at_frequency = calc_feedline_loss_per_100ft_at_frequency(freq_values, cable_values)
  
  let feedline_loss_for_matched_load_at_frequency = 
      calc_feedline_loss_for_matched_load_at_frequency(feedline_length, feedline_loss_per_100ft_at_frequency)
  
  let feedline_loss_for_matched_load_at_frequency_percentage = 
      calc_feedline_loss_for_matched_load_at_frequency_percentage(feedline_loss_for_matched_load_at_frequency)
  
  let gamma_squared = Math.abs(gamma)**2
  
  let feedline_loss_for_swr = calc_feedline_loss_for_swr(feedline_loss_for_matched_load_at_frequency_percentage, gamma_squared)
  
  let feedline_loss_for_swr_percentage = calc_feedline_loss_for_swr_percentage(feedline_loss_for_swr)
  
  let power_loss_at_swr = feedline_loss_for_swr_percentage * transmitter_power
  
  let peak_envelope_power_at_antenna = transmitter_power - power_loss_at_swr
  
  let uncontrolled_average_pep = peak_envelope_power_at_antenna * duty_cycle * uncontrolled_percentage_30_minutes
  
  let mpe_s = 180/(freq_values.freq**2)
  
  let gain_decimal = 10**(freq_values.gaindbi/10)
  
  //TODO:  Include effects of ground reflections
  
  return Math.sqrt((0.219 * uncontrolled_average_pep * gain_decimal)/mpe_s)
}

function calc_reflection_coefficient(freq_values) {
  return Math.abs(freq_values.swr - 1)/(freq_values.swr + 1);
}

function calc_feedline_loss_for_matched_load_at_frequency(feedline_length, feedline_loss_per_100ft_at_frequency) {
  return (feedline_length/100) * feedline_loss_per_100ft_at_frequency;
}

function calc_feedline_loss_for_matched_load_at_frequency_percentage(feedline_loss_for_matched_load) {
  return 10**(-feedline_loss_for_matched_load/10);
}

function calc_feedline_loss_per_100ft_at_frequency(freq_values, cable_values) {
  return cable_values.k1 * Math.sqrt(freq_values.freq + cable_values.k2 * freq_values.freq);
}

function calc_feedline_loss_for_swr(feedline_loss_for_matched_load_percentage, gamma_squared) {
  return -10 * Math.log10(feedline_loss_for_matched_load_percentage * ((1 - gamma_squared)/(1 - feedline_loss_for_matched_load_percentage**2 * gamma_squared)));
}

function calc_feedline_loss_for_swr_percentage( feedline_loss_for_swr ) {
  return (100 - 100/( 10**(feedline_loss_for_swr/10)))/100
}

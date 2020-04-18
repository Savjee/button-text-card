import { ActionConfig } from 'custom-card-helpers';

// TODO Add your configuration elements here for type-checking
export interface BoilerplateCardConfig {
  type: string;
  name?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  entity?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;

  // Specific for button-text-card
  title: string;
  icon: string;
  icon_color: string;
  subtitle: string;
  hide_condition: string;
  background_color?: string;
  large: boolean;
  font_color?: string;
}

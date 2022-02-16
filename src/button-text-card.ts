import { 
  LitElement, 
  html, 
  CSSResultGroup, 
  TemplateResult, 
  css, 
  PropertyValues 
} from 'lit';
import { customElement, property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  getLovelace,
} from 'custom-card-helpers';

import {
  HassEntity,
} from "home-assistant-js-websocket";

import { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_ID, CARD_VERSION } from './const';


/* eslint no-console: 0 */
console.info(
  `%c  ${CARD_ID.toUpperCase()} \n%c  v${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// Put the card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: CARD_ID,
  name: 'Button Text Card',
  description: 'Beautiful "neumorphism" card.',
  preview: true,
});

@customElement(CARD_ID)
export class BoilerplateCard extends LitElement {

  @state() private config!: BoilerplateCardConfig;
  private _renderedConfig?: BoilerplateCardConfig;

  @property({ attribute: false }) public hass?: HomeAssistant;
  @property() private _hasTemplate = false;
  @property() private _stateObj: HassEntity | undefined;

  public static getStubConfig(): Record<string, unknown> {
    return {
      title: "Button Text Card",
      subtitle: "Beautiful neumorphism card",
      icon: "mdi:cards-heart"
    };
  }

  private static templateFields = [
    'title',
    'subtitle',
    'icon',
    'icon_size',
    'hide_condition',
    'font_color',
    'background_color',
    'shadow_color',
    'large',
    'spin',
    'icon_color',
  ];

  private static templateRegex = new RegExp('\\[\\[\\[([^]*)\\]\\]\\]', 'gm');

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config || config.show_error) {
      throw new Error('Invalid configuration.');
    }

    this.config = {
      name: 'Button Text Card',
      title: '',
      subtitle: '',
      large: false,
      ...config,
    };

    // Make a copy of the config so we can render any templates
    this._renderedConfig = Object.assign({}, this.config);

    // Check if there is a template in a field
    for (const field of BoilerplateCard.templateFields) {
      const regResult = BoilerplateCard.templateRegex.exec(this.config[field]);
      BoilerplateCard.templateRegex.lastIndex = 0;
      if (regResult !== null) {
        this._hasTemplate = true;
        break;
      }
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    // Always render the card when there is no entity
    if (!this.config || !this.config.entity) {
      return true;
    }

    // // If there is an entity, update the card only when it changed state
    return hasConfigOrEntityChanged(this, changedProps, this._hasTemplate);
  }

  protected evaluateJsTemplates(): void {
    if (!this._renderedConfig || !this.config) {
      return;
    }

    for (const field of BoilerplateCard.templateFields) {
      const regMatches = BoilerplateCard.templateRegex.exec(this.config[field]);
      BoilerplateCard.templateRegex.lastIndex = 0;

      let content = this.config[field];
      if (regMatches && regMatches.length > 1) {
         content = this._evalTemplate(this._stateObj, regMatches[1]);
      }

      this._renderedConfig[field] = content;
    }
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass || !this._renderedConfig) {
      return this._showError("Invalid configuration");
    }

    this._stateObj = this.config.entity ? this.hass.states[this.config.entity] : undefined;

    // Render JS templates
    this.evaluateJsTemplates();

    if (!this._inEditMode() && this._renderedConfig.hide_condition === true) {
      return html``;
    }

    // If no icon was set by the user, try fetching one from HA
    if (!this.config.icon || this.config.icon === '') {
      let icon = 'mdi:alert-circle';

      if (this.config.entity) {
        const hassIcon = this.hass.states[this.config.entity].attributes.icon;
        if (hassIcon) {
          icon = hassIcon;
        }
      }

      this.setConfig({
        ...this.config,
        icon: icon,
      });
    }

    if (this._renderedConfig.background_color) {
      this.style.setProperty('--ha-card-background', this._renderedConfig.background_color);
    }

    if (this._renderedConfig.font_color) {
      this.style.setProperty('--primary-text-color', this._renderedConfig.font_color);
    }

    if (this._renderedConfig.icon_size) {
      this.style.setProperty('--mdc-icon-size', this._renderedConfig.icon_size + 'px');
    }

    this._configureIconColor();

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        class="${this._inEditMode() && this._renderedConfig.hide_condition === true ? 'edit-preview' : ''}"
        tabindex="0"
      >
        <div class="flex-container ${this._renderedConfig.large === true ? 'card-look' : ''}">
          <div class="icon-container ${this._renderedConfig.large === false ? 'card-look' : ''}">
            <ha-icon
              icon="${this._renderedConfig.icon}"
              class="${this._renderedConfig.icon_animation === 'spin' ? 'spin' : ''}"
            ></ha-icon>
          </div>

          ${this._renderedConfig.title === '' && this._renderedConfig.subtitle === ''
            ? html``
            : html`
                <div class="text-container">
                  <h1>${this._renderedConfig.title}</h1>
                  <p class="${this._renderedConfig.subtitle === '' ? 'hidden' : ''}">
                    ${this._renderedConfig.subtitle}
                  </p>
                </div>
              `}
        </div>
      </ha-card>
    `;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });

    return html`
      ${errorCard}
    `;
  }

  /**
   * Handles the icon color. Three possible situations:
   *
   * 1) User didn't set icon_color -> we use the theme's text
   *    color as icon color.
   *
   * 2) User set icon_color to "auto" -> We color the icon if the
   *    attached entity has the "on" state. Color is defined by
   *    --paper-item-icon-active-color
   *
   * 3) icon_color is not defined but user did specify font_color
   *    -> We use the font-color as icon_color as well
   *
   * 4) icon_color is set to anything but "auto" -> we use that value
   *    as CSS color code.
   */
  private _configureIconColor(): void {
    if (this._renderedConfig?.icon_color && this._renderedConfig.icon_color !== 'auto') {
      this.style.setProperty('--icon-color', this._renderedConfig.icon_color);
      return;
    }

    if (this._renderedConfig?.icon_color === 'auto' && this._stateObj?.state === 'on') {
      this.style.setProperty('--icon-color', 'var(--paper-item-icon-active-color)');
      return;
    }

    if (!this._renderedConfig?.icon_color && this._renderedConfig?.font_color) {
      this.style.setProperty('--icon-color', this._renderedConfig.font_color);
      return;
    }

    // If we get here, use the default text color
    this.style.setProperty('--icon-color', 'var(--primary-text-color)');
  }

  /**
   * Returns true if Lovelace is in edit mode. Primarily used to show hidden
   * cards while editing a dashboard to easily find the correct card.
   */
  private _inEditMode(): boolean {
    return getLovelace().editMode === true;
  }

  /**
   * Renders a Javascript template
   * Credit: https://github.com/custom-cards/button-card
   */
  private _evalTemplate(state: HassEntity | undefined, func: any): any {
    if (!this.hass) {
      return '';
    }

    /* eslint no-new-func: 0 */
    return new Function('states', 'entity', 'user', 'hass', 'variables', `'use strict'; ${func}`).call(
      this,
      this.hass.states,
      state,
      this.hass.user,
      this.hass,
      [],
    );
  }

  static get styles(): CSSResultGroup {
    return css`
      @-moz-keyframes spin {
        100% {
          -moz-transform: rotate(360deg);
        }
      }
      @-webkit-keyframes spin {
        100% {
          -webkit-transform: rotate(360deg);
        }
      }
      @keyframes spin {
        100% {
          -webkit-transform: rotate(360deg);
          transform: rotate(360deg);
        }
      }

      ha-card {
        background-color: rgba(255, 255, 255, 0);
        box-shadow: 2px 2px rgba(0, 0, 0, 0);
        padding: 16px;
        outline: none;
      }

      ha-card.edit-preview {
        opacity: 0.5;
      }

      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }

      .flex-container {
        width: 100%;
        display: flex;
        align-items: center;
        color: rgb(99, 107, 116);
      }

      .card-look {
        border-radius: 16px;
        background: var(--ha-card-background, var(--card-background-color, white));
        box-shadow: var(--ha-card-box-shadow, 9px 9px 17px rgba(0, 0, 0, 0.14), -9px -9px 17px rgba(0, 0, 0, 0.12));
      }

      .icon-container {
        width: 85px;
        height: 85px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }

      .text-container {
        color: var(--primary-text-color);
        margin-left: 24px;
      }

      .icon-container ha-icon {
        color: var(--icon-color);
      }

      .icon-container ha-icon.spin {
        -webkit-animation: spin 4s linear infinite;
        -moz-animation: spin 4s linear infinite;
        animation: spin 4s linear infinite;
      }

      .text-container {
        flex: 1;
      }
      .text-container h1 {
        font-size: 21px;
        font-weight: 500;
        margin: 0;
      }
      .text-container h1 + p {
        margin-top: 10px;
      }
      .text-container p {
        font-size: 15px;
        font-weight: 400;
        margin: 0;
      }

      .text-container p.hidden {
        display: none;
      }
    `;
  }
}

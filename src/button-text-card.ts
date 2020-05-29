import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
} from 'custom-card-helpers';

import { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { HassEntity } from 'home-assistant-js-websocket';

/* eslint no-console: 0 */
console.info(
  `%c  BUTTON-TEXT-CARD \n%c  v${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('button-text-card')
export class BoilerplateCard extends LitElement {
  @property() public hass?: HomeAssistant;
  @property() private _config?: BoilerplateCardConfig;
  private _renderedConfig?: BoilerplateCardConfig;

  @property() private _hasTemplate = false;
  @property() private _stateObj: HassEntity | undefined;

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

    this._config = {
      name: 'Button Text Card',
      title: '',
      subtitle: '',
      height: '85px',
      large: false,
      width: '85px',
      ...config,
    };

    // Make a copy of the config so we can render any templates
    this._renderedConfig = Object.assign({}, this._config);

    // Check if there is a template in a field
    for (const field of BoilerplateCard.templateFields) {
      const regResult = BoilerplateCard.templateRegex.exec(this._config[field]);
      BoilerplateCard.templateRegex.lastIndex = 0;
      if (regResult !== null) {
        this._hasTemplate = true;
        break;
      }
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    // Always render the card when there is no entity
    if (!this._config?.entity) {
      return true;
    }

    // If there is an entity, update the card only when it changed state
    return hasConfigOrEntityChanged(this, changedProps, this._hasTemplate);
  }

  protected evaluateJsTemplates(): void {
    if (!this._renderedConfig || !this._config) {
      return;
    }

    for (const field of BoilerplateCard.templateFields) {
      const regMatches = BoilerplateCard.templateRegex.exec(this._config[field]);
      BoilerplateCard.templateRegex.lastIndex = 0;

      if (regMatches && regMatches.length > 1) {
        this._renderedConfig[field] = this._evalTemplate(this._stateObj, regMatches[1]);
      } else {
        this._renderedConfig[field] = this._config[field];
      }
    }
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass || !this._renderedConfig) {
      return html``;
    }

    this._stateObj = this._config.entity ? this.hass.states[this._config.entity] : undefined;

    // Render JS templates
    this.evaluateJsTemplates();

    if (!this._inEditMode() && this._renderedConfig.hide_condition === true) {
      return html``;
    }

    // If no icon was set by the user, try fetching one from HA
    if (!this._config.icon || this._config.icon === '') {
      let icon = 'mdi:alert-circle';

      if (this._config.entity) {
        const hassIcon = this.hass.states[this._config.entity].attributes.icon;
        if (hassIcon) {
          icon = hassIcon;
        }
      }

      this.setConfig({
        ...this._config,
        icon: icon,
      });
    }

    if (this._renderedConfig.background_color) {
      this.style.setProperty('--primary-background-color', this._renderedConfig.background_color);
    }

    if (this._renderedConfig.font_color) {
      this.style.setProperty('--primary-text-color', this._renderedConfig.font_color);
    }

    if (this._renderedConfig.icon_size) {
      this.style.setProperty('--mdc-icon-size', this._renderedConfig.icon_size + 'px');
    }

    this.style.setProperty('--icon-width', this._renderedConfig.width);
    this.style.setProperty('--icon-height', this._renderedConfig.height);

    this._configureIconColor();

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleTap: hasAction(this._config.double_tap_action),
          repeat: this._config.hold_action ? this._config.hold_action.repeat : undefined,
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
    if (this.hass && this._config && ev.detail.action) {
      handleAction(this, this.hass, this._config, ev.detail.action);
    }
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
   * Returns true if Lovelace is in edit mode. This is quite hacky and might easily
   * break in future Lovelace versions. Unfortunately there isn't a better way atm.
   */
  private _inEditMode(): boolean {
    const el = document
      .querySelector('home-assistant')
      ?.shadowRoot?.querySelector('home-assistant-main')
      ?.shadowRoot?.querySelector('app-drawer-layout partial-panel-resolver ha-panel-lovelace')
      ?.shadowRoot?.querySelector('hui-root')
      ?.shadowRoot?.querySelector('ha-app-layout app-header');

    if (el) {
      return el.classList.contains('edit-mode');
    }

    return false;
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

  static get styles(): CSSResult {
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
        --paper-card-background-color: 'rgba(11, 11, 11, 0.00)';
        box-shadow: 2px 2px rgba(0, 0, 0, 0);
        padding: 16px;
        outline: none;
        cursor: pointer;
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
        background-color: var(--primary-background-color);
        box-shadow: var(--ha-card-box-shadow, 9px 9px 17px #c8c8c8, -9px -9px 17px #ffffff);
      }

      .icon-container {
        align-items: center;
        display: flex;
        height: var(--icon-height);
        justify-content: center;
        text-align: center;
        width: var(--icon-width);
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

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

  @property() private _hasTemplate = false;
  @property() private _stateObj: HassEntity | undefined;

  private static templateFields = ['title', 'subtitle', 'icon'];
  private static templateRegex = new RegExp('\\[\\[\\[(.*)\\]\\]\\]', 'gms');

  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config || config.show_error) {
      throw new Error('Invalid configuration.');
    }

    this._config = {
      name: 'Button Text Card',
      title: '',
      subtitle: '',
      ...config,
    };

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
    return hasConfigOrEntityChanged(this, changedProps, this._hasTemplate);
  }

  protected render(): TemplateResult | void {
    console.log('card', 'render');
    if (!this._config || !this.hass) {
      return html``;
    }

    this._stateObj = this._config.entity ? this.hass.states[this._config.entity] : undefined;

    // Render templates
    for (const field of BoilerplateCard.templateFields) {
      const regMatches = BoilerplateCard.templateRegex.exec(this._config[field]);
      BoilerplateCard.templateRegex.lastIndex = 0;

      const storeKey = '_rendered_' + field;

      if (regMatches && regMatches.length > 1) {
        this._config[storeKey] = this._evalTemplate(this._stateObj, regMatches[1]);
      } else {
        this._config[storeKey] = this._config[field];
      }
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
        _rendered_icon: icon,
      });
    }

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleTap: hasAction(this._config.double_tap_action),
          repeat: this._config.hold_action ? this._config.hold_action.repeat : undefined,
        })}
        tabindex="0"
      >
        <div class="flex-container">
          <div class="icon-container">
            <ha-icon icon="${this._config._rendered_icon}"></ha-icon>
          </div>

          <div class="text-container">
            <h1>${this._config._rendered_title}</h1>
            <p class="${this._config._rendered_subtitle === '' ? 'hidden' : ''}">${this._config._rendered_subtitle}</p>
          </div>
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
      ha-card {
        --paper-card-background-color: 'rgba(11, 11, 11, 0.00)';
        box-shadow: 2px 2px rgba(0, 0, 0, 0);
        padding: 16px;
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

      .icon-container {
        width: 85px;
        height: 85px;
        margin-right: 24px;
        border-radius: 16px;
        background-color: var(--primary-background-color);
        box-shadow: 9px 9px 17px #c8c8c8, -9px -9px 17px #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-container ha-icon,
      .text-container {
        color: var(--primary-text-color);
      }
      .icon-container ha-icon {
        width: 33px;
        height: 33px;
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

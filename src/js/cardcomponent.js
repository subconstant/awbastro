import { LitElement, html, css } from 'lit';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(Draggable, InertiaPlugin);

export class ArcanaCard extends LitElement {

  draggableInstance = null;

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);

    this.draggableInstance = Draggable.create(this, {
      type: 'x,y',
      bounds: '.cardcontainer',
      inertia: true,
      onDrag: () => {
        const dragEvent = new CustomEvent('card-drag', {
          bubbles: true,
          composed: true,
          detail: {
            x: this.draggableInstance.x,
            y: this.draggableInstance.y 
          }
        });

        this.dispatchEvent(dragEvent);
      },
      onPress: () => {
        this.style.zIndex = 100;
      },
      onRelease: () => {
        this.style.zIndex = 1;
      }
    })[0];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.draggableInstance) {
      this.draggableInstance.kill();
    }
  }

  static get properties() {
    return {
      imgSrc: { type: String, attribute: 'img-src' },
      sign: { type: String },
      name: { type: String },
      cardDataName: { type: String, attribute: 'data-name', reflect: true }
    };
  }

  constructor() {
    super();
    this.imgSrc = '';
    this.sign = 'Sign';
    this.name = 'Name';
    this.cardDataName = 'Name';
  }

  static styles = css`
  `;

  render() {
    return html`
      <div class="card flex flex-col w-40">
        <img class="cardimg border-1" src=${this.imgSrc} />
        <div class="flex flex-row">
          <div class="cardname bg-white border-1 !border-t-0 p-1 box-border w-fit inline-block">${this.sign}</div>
          <div class="cardname bg-white border-1 !border-t-0 p-1 box-border w-fit inline-block">${this.name}</div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define('arcana-card', ArcanaCard);
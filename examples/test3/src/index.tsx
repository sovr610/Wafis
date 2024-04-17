
import MiniFramework from "./MiniFramework";
import { render, FrameworkEl } from "./MiniFramework";

// Use the component in your markup
const myMarkup = () => {
  return (
    <div data-x="data attribute test">
      <div id="id-test">
        <h1>Mini Framework</h1>
        <input
          type="text"
          placeholder="Part 2: data binding & hooks coming soon"
        />
      </div>
    </div>
  );
};

render(myMarkup() as FrameworkEl, document.querySelector("#app"));

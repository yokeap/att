
  var vm = new Vue({
    el: "#app",
    components: {
        "vue-touch-keyboard": VueTouchKeyboard.component
    },

    data: {
      visible: false,
      layout: "normal",
      input: null,
      options: {
        useKbEvents: false
      }
    },

    methods: {
        accept(text) {
          console.log("Input text: " + text);
          this.hide();
        },

        show(e) {
          this.input = e.target;
          this.layout = e.target.dataset.layout;

          if (!this.visible)
            this.visible = true
        },

        hide() {
          this.visible = false;
        },

				next() {
					let inputs = document.querySelectorAll("input");
          console.log(inputs[0].value);
					let found = false;
					[].forEach.call(inputs, (item, i) => {
						if (!found && item == this.input && i < inputs.length - 1) {
							found = true;
              console.log(inputs[0].value);
							this.$nextTick(() => {
								inputs[i+1].focus();
							});
						}
					});
					if (!found) {
						this.input.blur();
						this.hide();
					}
				}
    }
});

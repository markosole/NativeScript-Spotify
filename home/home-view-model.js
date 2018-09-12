const observableModule = require("data/observable");

const SelectedPageService = require("../shared/selected-page-service");
const sliderModule = require("tns-core-modules/ui/slider"); 


function HomeViewModel() {
    SelectedPageService.getInstance().updateSelectedPage("Home");

    const viewModel = observableModule.fromObject({
        /* Add your view model properties here */
        // textSource: "Osvjetljenje: " + 34 + "%"
        textSource: 32
    });

    return viewModel;
}

function onSliderValueChange(args) {
    viewModel.set("textSource", args.value);
    console.log(args);
}

exports.onSliderValueChange = onSliderValueChange;
module.exports = HomeViewModel;

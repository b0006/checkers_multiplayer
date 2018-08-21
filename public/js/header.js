
$( document ).ready(function() {
    addDynamicEventListener(document.body, 'click', '#time_check_checkbox', function (e) {

    });

    addDynamicEventListener(document.body, 'click', '#fuchs', function (e) {
        if ($("#fuchs").prop('checked')) {
            $("#color_potencial_fuchs").show();
        }
        else {
            $("#color_potencial_fuchs").hide();
        }
    });

    addDynamicEventListener(document.body, 'click', '#cp_play', function (e) {
        let fields = $("#cpu_level").serializeArray();

        let isChooseLevel = false;

        fields.forEach(function (value, index) {
            if(value.name === "level") {
                isChooseLevel = true;
            }
        });

        if(!isChooseLevel) {
            alert("Выберите сложность");
            e.preventDefault();
        }
    });

    addDynamicEventListener(document.body, 'submit', '#cpu_level', function (e) {
        e.preventDefault();

        //простите
        let data_form_settings = $("#settings").serializeArray();
        let comp_level = $("#cpu_level").serializeArray();
        let data = [];

        data_form_settings.forEach(function (value) {
            data[value.name] = [];
            data[value.name] = value.value;
        });

        comp_level.forEach(function (value) {
            data[value.name] = [];
            data[value.name] = value.value;
        });

        $.redirect("/game/ai", data, "POST");

    });
});

(function ($, channel, window, undefined) {
    "use strict";

    var ACTION_ICON = "coral-Icon--coverImage";
    var ACTION_TITLE = "Generate Image - Generative AI";
    var ACTION_NAME = "Image Generation";

    var imageGenerationAction = new Granite.author.ui.ToolbarAction({
        name: ACTION_NAME,
        icon: ACTION_ICON,
        text: ACTION_TITLE,
        execute: function (editable) {
            showDialog(editable.path);
        },
        condition: function (editable) {
            console.log(editable.path);
            return editable && editable.type === "GenerativeAI/components/image";
        },
        isNonMulti: true,
    });

    channel.on("cq-layer-activated", function (event) {
        if (event.layer === "Edit") {
            Granite.author.EditorFrame.editableToolbar.registerAction("IMAGEGENERATION", imageGenerationAction);
        }
    });

    function showDialog(componentpath) {

        var dialog = document.querySelector('#generateImage');

        if (dialog) {
            var alert=$("#coralalert");
            alert[0].hide();
            dialog.content.querySelector("#coralwait").hide();
            dialog.show();
            return;
          }

        // Create the dialog
        var dialog = new Coral.Dialog().set({
            id: 'generateImage',
            header: {
                innerHTML: 'Generate Image - Generative AI'
            },
            content: {
                innerHTML: getDialogContentHTML()
            },
            footer: {
                innerHTML: '<button is="coral-button" id="generate"variant="primary">Generate</button><button is="coral-button" id="saveimage"variant="primary">Save Image</button><button is="coral-button" variant="primary" coral-close="">Close</button>'
            },
            closable: true,
            movable: true
        });


        // Add an event listener to the submit button
        dialog.footer.querySelector("#saveimage").addEventListener("click", function () {

            var imagename = dialog.content.querySelector("#imagename").value;
            var damfolderpath = dialog.content.querySelector("#damfolderpathvalue").value;
            var remoreImageURL = dialog.content.querySelector("#imagePreview").src;

            var data = { "damfolderpath": damfolderpath, "imagename": imagename, "operationname": "SaveImage", "componentpath": componentpath, "remoreImageURL": remoreImageURL };

            var servletUrl = "/bin/imagegenerator";

            // Send a request to the servlet
            var xhr = new XMLHttpRequest();
            xhr.open("POST", servletUrl, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            dialog.content.querySelector("#coralwait").show();
            $("#coralalert")[0].hide();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

					dialog.content.querySelector("#coralwait").hide();
                    $("#coralalert")[0].hide();
                    dialog.hide();
                    Granite.author.ContentFrame.reload();
                } else {
                    dialog.content.querySelector("#coralwait").hide();

                    var alert=$("#coralalert");
                    alert[0].variant = "error";
                    alert[0].header.textContent ="ERROR";
                    alert[0].content.innerHTML = xhr.responseText;
                    alert[0].show();
                }
            };
            xhr.send(JSON.stringify(data));
        });

        // Add an event listener to the submit button
        dialog.footer.querySelector("#generate").addEventListener("click", function () {

            promptvalue = dialog.content.querySelector("#promptvalue").value;
            var imagePreview = dialog.content.querySelector("#imagePreview");

            var data = { "prompt": promptvalue, "operationname": "Generate" };
            var servletUrl = "/bin/imagegenerator";

            // Send a request to the servlet
            var xhr = new XMLHttpRequest();
            xhr.open("POST", servletUrl, true);
            xhr.setRequestHeader('Content-type', 'application/json');
            dialog.content.querySelector("#coralwait").show();
            $("#coralalert")[0].hide();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    imagePreview.src = xhr.responseText;
                    dialog.content.querySelector("#coralwait").hide();

                    var alert=$("#coralalert");
                    alert[0].variant = "success";
                    alert[0].header.textContent ="SUCCESS";
                    alert[0].content.innerHTML = "Image Generated Successfully. Please review and Save";
                    alert[0].show();

                } else {
                    var alert=$("#coralalert");
                    alert[0].variant = "error";
                    alert[0].header.textContent ="ERROR";
                    alert[0].content.innerHTML = xhr.responseText;
                    alert[0].show();
                    dialog.content.querySelector("#coralwait").hide();
                }
            };
           xhr.send(JSON.stringify(data));
        });

        // Open the dialog
        document.body.appendChild(dialog);
        dialog.show();
    }


    function getDialogContentHTML() {

        return `
          <form class="coral-Form coral-Form--vertical">
                  <section class="coral-Form-fieldset">
                      <div class="coral-Form-fieldwrapper">
                      	  <coral-wait  hidden id="coralwait"></coral-wait>
                          <coral-alert id="coralalert" hidden><coral-alert-header></coral-alert-header><coral-alert-content></coral-alert-content></coral-alert>
					   </div>

                      <div class="coral-Form-fieldwrapper">
                          <textarea is="coral-textarea" class="coral-Form-field" placeholder="Enter your prompt" id="promptvalue"></textarea>
                      </div>

                      <div class="coral-Form-fieldwrapper">
                           <foundation-autocomplete
                          placeholder="Select DAM Parent Folder to store the image."
                          class="coral-Form-field"
                          name="./damfolderpath" id="damfolderpathvalue" pickersrc="/mnt/overlay/granite/ui/content/coral/foundation/form/pathfield/picker.html?_charset_=utf-8&amp;path={value}&amp;root=%2fcontent%2fdam&amp;filter=hierarchyNotFile&amp;selectionCount=single&amp;nodeTypes="
                          data-foundation-validation=""
                          >
                          <div class="foundation-autocomplete-inputgroupwrapper">
                              <div class="coral-InputGroup" role="presentation">
                                  <input
                                      is="coral-textfield"
                                      class="coral-InputGroup-input coral-Form-field"
                                      autocomplete="off"
                                      role="combobox"
                                      aria-expanded="false"
                                      variant="default"
                                      aria-controls=""
                                      aria-autocomplete="none"
                                      />
                                  <span class="coral-InputGroup-button">
                                      <button is="coral-button" title="Open Selection Dialog" type="button" aria-label="Open Selection Dialog" variant="default" class="_coral-Button _coral-Button--primary" size="M">
                                          <coral-icon size="S" class="_coral-Icon--sizeS _coral-Icon" role="img" icon="FolderOpenOutline" aria-hidden="true">
                                              <svg focusable="false" aria-hidden="true" class="_coral-Icon--svg _coral-Icon">
                                                  <use xlink:href="#spectrum-icon-18-FolderOpenOutline"></use>
                                              </svg>
                                          </coral-icon>
                                          <coral-button-label class="_coral-Button-label"></coral-button-label>
                                      </button>
                                  </span>
                              </div>
                          </div>
                          <coral-overlay
                              foundation-autocomplete-suggestion=""
                              class="foundation-picker-buttonlist _coral-Overlay" data-foundation-picker-buttonlist-src="/mnt/overlay/granite/ui/content/coral/foundation/form/pathfield/suggestion{.offset,limit}.html?_charset_=utf-8&amp;root=%2fcontent%2fdam&amp;filter=hierarchyNotFile{&amp;query}"
                              style="display: none; visibility: visible;">
                              </coral-overlay>
                          <coral-taglist foundation-autocomplete-value="" name="./damfolderpath" class="_coral-Tags" role="grid" aria-live="off" aria-atomic="false" aria-relevant="additions"></coral-taglist>
                          <input class="foundation-field-related" type="hidden" name="./damfolderpath@Delete" />
                      </foundation-autocomplete>
                      </div>

  
                       <div class="coral-Form-fieldwrapper">
                          <input is="coral-textfield" class="coral-Form-field" placeholder="Enter Image Name without extension" id="imagename"></input>
                      </div>
  
                  <div class="coral-Form-fieldwrapper">
  
                      <img id="imagePreview" width="319" height="319"/>
  
                  </div>
  
                  </section>
              </form>  
          `;
    }

})(jQuery, jQuery(document), this);
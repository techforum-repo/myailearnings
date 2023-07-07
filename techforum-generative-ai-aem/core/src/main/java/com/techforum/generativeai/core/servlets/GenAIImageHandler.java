package com.techforum.generativeai.core.servlets;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

import org.osgi.service.component.annotations.Component;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.ModifiableValueMap;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.framework.Constants;

import com.day.cq.dam.api.AssetManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.techforum.generativeai.core.beans.ImageRequest;
import com.techforum.generativeai.core.beans.ImageResponse;
import com.techforum.generativeai.core.beans.InputData;

import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;

@Component(immediate = true, service = Servlet.class, property = {
        Constants.SERVICE_DESCRIPTION + "=OpeAI API Integration -  DALL\u00B7E",
        "sling.servlet.methods=" + HttpConstants.METHOD_POST,
        "sling.servlet.paths=" + "/bin/imagegenerator",
        "sling.servlet.extensions={\"json\"}"
})
public class GenAIImageHandler extends SlingAllMethodsServlet {

    private static final Logger LOGGER = LoggerFactory.getLogger(GenAIImageHandler.class);

    // OpenAI API endpoints
    private static final String IMAGE_GENERATION_API_ENDPOINT = "https://api.openai.com/v1/images/generations";
    private static final String IMAGE_EDIT_API_ENDPOINT = "https://api.openai.com/v1/images/edits";
    private static final String IMAGE_VARIATIONS_API_ENDPOINT = "https://api.openai.com/v1/images/variations";

    private static final HttpClient client = HttpClients.createDefault();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    // Handles POST requests to the servlet
    @Override
    protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        try {

            // Convert the request data to InputData object
            String data = IOUtils.toString(request.getReader());
            Gson gson = new Gson();
            InputData inputData = gson.fromJson(data, InputData.class);

            // Handle the operation based on the operation name
            switch (inputData.getOperationname()) {
                case "Generate":
                    // Generate the image and send the response back
                    ImageResponse imageResponse = sendPrompt(inputData);
                    if(imageResponse.getError()!=null)
                    {
                        response.setStatus(500);
                        response.getWriter().write(imageResponse.getError().getMessage());  
                    }else
                    {
                        response.getWriter().write(imageResponse.getData().get(0).getUrl());
                    }
                    break;
                case "SaveImage":
                    // Save the image to the DAM
                    saveImageToDAM(request.getResourceResolver(), inputData);
                    break;

                default:
                    break;
            }

        } catch (Exception e) {
            LOGGER.error("Error: "+ e.getMessage());
            response.setStatus(500); 
            response.getWriter().write("Failed to Complete the Request. Please try again later");         
        }

    }

    // Send a POST request to the OpenAI API to generate an image
    private ImageResponse sendPrompt(InputData inputData) throws IOException {

        // Prepare the request body
        String requestBody = MAPPER
                .writeValueAsString(ImageRequest.builder().prompt(inputData.getPrompt()).n(1).size("512x512").build());
        HttpPost request = new HttpPost(IMAGE_GENERATION_API_ENDPOINT);
        request.addHeader("Authorization", "Bearer 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");
        request.addHeader("Content-Type", "application/json");
        request.setEntity(new StringEntity(requestBody));

        // Execute the request and map the response to an ImageResponse object
        HttpResponse response = client.execute(request);
        ImageResponse imageResponse = MAPPER.readValue(EntityUtils.toString(response.getEntity()), ImageResponse.class);

        return imageResponse;

    }

    // Save an image to the AEM DAM
    private void saveImageToDAM(ResourceResolver resourceResolver, InputData inputData) throws Exception {

        InputStream is = null;
        String mimeType = "";
        try {

            // Open a connection to the remote image URL
            URL Url = new URL(inputData.getRemoreImageURL());
            URLConnection uCon = Url.openConnection();
            is = uCon.getInputStream();
            mimeType = uCon.getContentType();

            // Create the asset in the DAM
            String fileExt = mimeType.replaceAll("image/", "");
            String imagePath = inputData.getDamfolderpath() + "/" + inputData.getImagename() + "." + fileExt;
            resourceResolver.adaptTo(AssetManager.class).createAsset(imagePath, is, mimeType, true);
            updateImageProperties(resourceResolver, imagePath, inputData.getComponentpath());

        } catch (Exception e) {
            throw new Exception(e.getMessage());
        } finally {
            // Close the InputStream
            try {
                if (is != null) {
                    is.close();
                }
            } catch (IOException e) {

            }
        }
    }

    // Update the properties of the component with the new image path
    private void updateImageProperties(ResourceResolver resolver, String imagePath, String componentPath)
            throws Exception {
        Resource resource = resolver.getResource(componentPath);
        ModifiableValueMap map = resource.adaptTo(ModifiableValueMap.class);
        map.put("fileReference", imagePath);
        map.put("imageFromPageImage", false);
        resolver.commit();
    }

}

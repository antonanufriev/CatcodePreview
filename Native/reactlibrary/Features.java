package com.reactlibrary;

//import org.json.JSONObject;
import org.opencv.core.Mat;
import org.opencv.core.MatOfKeyPoint;

import java.util.Date;

public class Features {
    String ID;
    String name;
    Date timestamp;

    float[] neuralcode;

    String attachments;

    public String getID() {
        return ID;
    }

    public void setID(String ID) {
        this.ID = ID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public String getAttachments() {
        return attachments;
    }

    public void setAttachments(String attachments) {
        this.attachments = attachments;
    }

    public float[] getNeuralCode() {
        return neuralcode;
    }

    public void setNeuralcode(float[] neuralcode) {
        this.neuralcode = neuralcode;
    }
}

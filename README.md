# Heart Rate Monitoring System Design

Design and implementation of low-cost IoT-enabled web app for monitoring heart rate and blood oxygen saturation level.

Milestone submission
## Usage

To use the Heart Rate Monitoring System, navigate to the login page and enter the provided credentials:

- **Login Page**: [https://pulseo2monitor.onrender.com/login.html](https://pulseo2monitor.onrender.com/login.html)

- **Credentials**:
  - Email: `johnsmith@gmail.com`
  - Password: `password1234`

If you want to create an account, follow the steps below:

1. Go to [Account Creation Page](https://pulseo2monitor.onrender.com/signUp.html) and create an account.
2. Enter `e00fce689a40d73e1ff0573a` in the deviceId input field and press the **Register Device** button.
   - Note: this will take to an empty sensor data page because you have not registered any device to your account and started sending sensor data yet.
3. Compile and flash the firmware `heartRateAndSpO2.ino` onto your particle device.
4. Take measurements by putting your index finger on the sensor. Make sure to apply pressure when placing your finger.
   - Note: We recommend that you open your serial monitor to get feedback on whether heart rate and SpO2 values are measured correctly.
5. Go back to the sensor data page [Sensor Data](https://pulseo2monitor.onrender.com/sensorData.html) and refresh it. You should see the measured values in tabular format.

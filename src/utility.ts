import { v3 as hue } from "node-hue-api";
import { Api } from "node-hue-api/dist/esm/api/Api";

export async function getApi() {
  const username: string = process.env.HUE_USERNAME;
  const host: string = process.env.HUE_HOST;

  try {
    return await hue.api.createLocal(host).connect(username);
  } catch (error) {
    console.error(`Failed to connect. Exiting. Error: ${error}`);
    throw error;
  }
}

export async function getRules(api: Api) {
  try {
    return await api.rules.getAll();
  } catch (error) {
    console.error(`Failed to fetch rules. Exiting. Error: ${error}`);
    throw error;
  }
}

export async function clearRules(api: Api) {
  const rules = await getRules(api);
  const username: string = process.env.HUE_USERNAME;

  for (const rule of rules) {
    if (rule.owner === username) {
      console.log(`Deleting a Rule\n ${rule.toStringDetailed()}`);
      const success = await api.rules.deleteRule(rule);
      if (!success) {
        console.error(`Failed to delete rule: ${rule.toStringDetailed()}`);
        throw new Error("Rule deletion failure");
      }
    } else {
      console.log(rule.toStringDetailed());
    }
  }
}

export async function clearClipSensors(api: Api) {
  const sensors = await api.sensors.getAll();
  const prefix: string = process.env.PREFIX;

  for (const sensor of sensors) {
    const uniqueid: string | null = sensor.getAttributeValue("uniqueid");
    if (
      sensor.getAttributeValue("manufacturername") === "hue-rules-manager" &&
      uniqueid &&
      uniqueid.startsWith(prefix)
    ) {
      console.log(`Deleting a CLIP Sensor\n${sensor.toStringDetailed()}`);
      const success = await api.sensors.deleteSensor(sensor);
      if (!success) {
        console.error(`Failed to delete sensor: ${sensor.toStringDetailed()}`);
        throw new Error("CLIP Sensor deletion failure");
      }
    }
  }
}

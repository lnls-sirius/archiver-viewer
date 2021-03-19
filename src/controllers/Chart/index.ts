import { ChartController } from "./interface";
import { ChartControllerImpl } from "./impl";

const chartController: ChartController = new ChartControllerImpl();

export default chartController;

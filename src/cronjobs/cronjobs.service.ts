import settingModel from "@/resources/adminConfig/setting.model";
import OrderService from "@/resources/order/order.service";
import * as cron from "node-cron";

class CronJobService {
	private orderService = new OrderService();

	public async remitVendorSales() {
		try {
			const cronExpression = "0 * * * *";
			const task = cron.schedule(
				cronExpression,
				() => this.orderService.remitVendorSales(),
				{
					scheduled: false,
					timezone: "Africa/Lagos",
				}
			);
			task.start();
			console.log("Vendor Remittances Job Scheduled.");
		} catch (error: any) {
			console.log("🚀 ~ CronJobService ~ remitVendorSales ~ error:", error);
		}
	}
}

export default CronJobService;

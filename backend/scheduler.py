import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def get_trigger(frequency: str):
    if frequency == "daily":
        return CronTrigger(hour=8, minute=0)
    elif frequency == "weekly":
        return CronTrigger(day_of_week="mon", hour=8, minute=0)
    elif frequency == "monthly":
        return CronTrigger(day=1, hour=8, minute=0)
    else:
        return CronTrigger(hour=8, minute=0)


def schedule_config(config_id: int, frequency: str, run_fn):
    job_id = f"config_{config_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    trigger = get_trigger(frequency)
    scheduler.add_job(
        run_fn,
        trigger=trigger,
        args=[config_id],
        id=job_id,
        replace_existing=True,
        misfire_grace_time=3600,
    )
    logger.info(f"Scheduled job {job_id} with frequency {frequency}")
    return job_id


def remove_scheduled_job(config_id: int):
    job_id = f"config_{config_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Removed job {job_id}")

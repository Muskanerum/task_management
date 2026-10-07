from django.core.management import call_command
from django.core.management.base import BaseCommand

from tasks.models import Task


class Command(BaseCommand):
    help = "Load sample tasks, only when the database has no tasks yet."

    def handle(self, *args, **options):
        if Task.objects.exists():
            self.stdout.write("Tasks already exist, skipping sample data.")
            return

        call_command("loaddata", "sample_tasks")
        self.stdout.write(self.style.SUCCESS("Sample tasks loaded."))

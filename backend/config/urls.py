from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/chat/", include("chatbot.urls")),
    path("api/", include("core.urls")),
]

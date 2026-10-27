<?php

namespace Modules\Media\Tests;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Modules\Shared\Tests\ApiTestCase;

class UploadTest extends ApiTestCase
{
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['menuhub.media.disk' => 'public']);
    }

    private function image(string $name = 'a.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(self::PNG));
    }

    public function test_member_can_upload_an_image(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $url = $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertSuccessful()->json('data.url');

        $this->assertNotEmpty($url);
    }

    public function test_non_members_and_anonymous_users_cannot_upload(): void
    {
        [, $restaurant] = $this->makeRestaurant();

        $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertUnauthorized();

        Sanctum::actingAs($this->makeUser());
        $this->post($this->api('uploads'), [
            'file' => $this->image(), 'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertForbidden();
    }

    public function test_non_images_are_rejected(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->post($this->api('uploads'), [
            'file' => UploadedFile::fake()->createWithContent('x.php', '<?php echo 1;'),
            'folder' => 'products', 'restaurant_id' => $restaurant->id,
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }
}

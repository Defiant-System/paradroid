<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template name="level">
		<div class="level" style="--w: 12; --h: 6;" data-level="A" data-click="put-tile">
			<xsl:for-each select="./*">
				<b>
					<xsl:attribute name="class"><xsl:value-of select="@id" /></xsl:attribute>
				</b>
			</xsl:for-each>
		</div>
	</xsl:template>

</xsl:stylesheet>